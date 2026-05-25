"""pynput-based keyboard monitor."""

import statistics
import threading
import time
from typing import Optional

from pynput import keyboard


def _now_ms() -> float:
    return time.time() * 1000.0


class PynputKeyboardMonitor:
    """Thread-safe keystroke aggregator."""

    def __init__(self, max_reasonable_flight_ms: int, min_keystrokes_per_batch: int) -> None:
        self._max_reasonable_flight_ms = max_reasonable_flight_ms
        self._min_keystrokes_per_batch = min_keystrokes_per_batch
        self._lock = threading.Lock()
        self._listener: Optional[keyboard.Listener] = None
        self._reset_unlocked()

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def start(self) -> None:
        with self._lock:
            self._reset_unlocked()
        self._listener = keyboard.Listener(
            on_press=self._on_press,
            on_release=self._on_release,
        )
        self._listener.start()

    def stop(self) -> None:
        if self._listener is not None:
            self._listener.stop()
            self._listener = None

    # ------------------------------------------------------------------
    # State
    # ------------------------------------------------------------------

    def _reset_unlocked(self) -> None:
        self._dwell_ms: list[float] = []
        self._flight_ms: list[float] = []
        self._press_times: dict[str, float] = {}
        self._last_keydown_ms: Optional[float] = None
        self._first_keydown_ms: Optional[float] = None
        self._total_keystrokes = 0
        self._delete_count = 0

    @staticmethod
    def _key_id(key) -> str:
        try:
            return key.char or repr(key)
        except AttributeError:
            return repr(key)

    @staticmethod
    def _is_deletion(key) -> bool:
        return key in (keyboard.Key.backspace, keyboard.Key.delete)

    # ------------------------------------------------------------------
    # Listener callbacks
    # ------------------------------------------------------------------

    def _on_press(self, key) -> None:
        now = _now_ms()
        kid = self._key_id(key)
        is_del = self._is_deletion(key)

        with self._lock:
            if self._first_keydown_ms is None:
                self._first_keydown_ms = now

            if self._last_keydown_ms is not None:
                gap = now - self._last_keydown_ms
                if 0 < gap < self._max_reasonable_flight_ms:
                    self._flight_ms.append(gap)
            self._last_keydown_ms = now

            if kid not in self._press_times:
                self._press_times[kid] = now
                self._total_keystrokes += 1
                if is_del:
                    self._delete_count += 1

    def _on_release(self, key) -> None:
        now = _now_ms()
        kid = self._key_id(key)
        with self._lock:
            press_ms = self._press_times.pop(kid, None)
            if press_ms is None:
                return
            dwell = now - press_ms
            if 0 < dwell < self._max_reasonable_flight_ms:
                self._dwell_ms.append(dwell)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def collect_features(self, reset: bool = True) -> Optional[dict]:
        with self._lock:
            if self._total_keystrokes < self._min_keystrokes_per_batch:
                if reset:
                    self._reset_unlocked()
                return None

            mean_dwell = statistics.mean(self._dwell_ms) if self._dwell_ms else 0.0
            median_flight = statistics.median(self._flight_ms) if self._flight_ms else 0.0

            cv_flight = 0.0
            if len(self._flight_ms) >= 2:
                m = statistics.mean(self._flight_ms)
                if m > 0:
                    cv_flight = statistics.stdev(self._flight_ms) / m

            mean_del_freq = (
                (self._delete_count / self._total_keystrokes) * 100.0
            )

            mean_tot_time = (
                _now_ms() - self._first_keydown_ms
                if self._first_keydown_ms is not None
                else 0.0
            )

            if mean_dwell <= 0 or median_flight <= 0 or mean_tot_time <= 0:
                if reset:
                    self._reset_unlocked()
                return None

            features = {
                "meanDwell": round(mean_dwell, 2),
                "medianFlight": round(median_flight, 2),
                "cvFlight": round(cv_flight, 4),
                "meanDelFreq": round(mean_del_freq, 2),
                "meanTotTime": round(mean_tot_time, 2),
                "nKeys": self._total_keystrokes,
                "_deleteCount": self._delete_count,
            }

            if reset:
                self._reset_unlocked()

            return features

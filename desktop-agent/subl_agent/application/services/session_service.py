"""Session lifecycle and metrics sender."""

import logging
import threading
import time
from datetime import datetime, timezone
from typing import Callable, Optional

from subl_agent.application.dtos import Reading, SessionInfo
from subl_agent.application.errors import ApiError
from subl_agent.application.ports import ApiGateway, DeviceStore, KeyboardMonitor
from subl_agent.domain.models import DeviceProfile

log = logging.getLogger(__name__)

ReadingCallback = Callable[[Reading], None]
ErrorCallback = Callable[[Exception], None]
SessionEndedCallback = Callable[[], None]


class SessionService:
    """Owns the active session and the metrics-sender thread."""

    def __init__(
        self,
        api: ApiGateway,
        monitor: KeyboardMonitor,
        device_store: DeviceStore,
        device_profile: DeviceProfile,
        batch_interval_seconds: int,
        on_reading: Optional[ReadingCallback] = None,
        on_error: Optional[ErrorCallback] = None,
        on_session_ended: Optional[SessionEndedCallback] = None,
    ) -> None:
        self._api = api
        self._monitor = monitor
        self._device_store = device_store
        self._device_profile = device_profile
        self._batch_interval_seconds = batch_interval_seconds
        self._on_reading = on_reading
        self._on_error = on_error
        self._on_session_ended = on_session_ended

        self._session_id: Optional[str] = None
        self._device_id: Optional[str] = self._device_store.load_device_id()
        self._stop_event = threading.Event()
        self._sender: Optional[threading.Thread] = None
        self._is_paused = False
        # When True, a server-side 404/409 (expired session) triggers an
        # automatic new-session start instead of stopping the agent.
        self._auto_restart = True

    # ------------------------------------------------------------------
    # Public state
    # ------------------------------------------------------------------

    @property
    def session_id(self) -> Optional[str]:
        return self._session_id

    @property
    def is_running(self) -> bool:
        return self._session_id is not None

    @property
    def is_paused(self) -> bool:
        return self._is_paused

    def set_callbacks(
        self,
        on_reading: Optional[ReadingCallback] = None,
        on_error: Optional[ErrorCallback] = None,
        on_session_ended: Optional[SessionEndedCallback] = None,
    ) -> None:
        self._on_reading = on_reading
        self._on_error = on_error
        self._on_session_ended = on_session_ended

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def get_active_session(self) -> Optional[SessionInfo]:
        return self._api.get_active_session()

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def start(self, notes: Optional[str] = None) -> str:
        if self.is_running:
            raise RuntimeError("A session is already running")

        if self._device_id is None:
            self._device_id = self._api.register_device(self._device_profile)
            self._device_store.save_device_id(self._device_id)

        log.info("Starting stress session for device %s", self._device_id)
        session_id = self._api.start_session(self._device_id, notes)
        self._session_id = session_id
        self._is_paused = False

        self._monitor.start()
        self._start_sender()
        return session_id

    def attach(self, session_id: str, is_paused: bool = False) -> None:
        if self.is_running:
            raise RuntimeError("A session is already running")

        self._session_id = session_id
        self._is_paused = is_paused
        if not is_paused:
            self._monitor.start()
        self._start_sender()

    def pause(self) -> None:
        if not self.is_running or self._is_paused:
            return
        self._send_one_batch()
        self._api.pause_session(self._session_id)
        self._is_paused = True
        self._monitor.stop()
        log.info("Session paused")

    def resume(self) -> None:
        if not self.is_running or not self._is_paused:
            return
        self._api.resume_session(self._session_id)
        self._monitor.start()
        self._is_paused = False
        log.info("Session resumed")

    def stop(self, reason: str = "User stopped") -> None:
        if not self._session_id:
            return
        log.info("Stopping session %s (%s)", self._session_id, reason)

        self._stop_event.set()
        try:
            self._send_one_batch()
        except ApiError as ex:
            log.warning("Failed to flush final batch: %s", ex)

        self._monitor.stop()

        try:
            self._api.end_session(self._session_id, reason)
        except ApiError as ex:
            log.warning("Failed to end session on the server: %s", ex)

        if self._sender is not None:
            self._sender.join(timeout=2)
        self._sender = None
        self._session_id = None
        self._is_paused = False

        if self._on_session_ended:
            try:
                self._on_session_ended()
            except Exception:  # noqa: BLE001
                log.exception("on_session_ended callback raised")

    def end_remote_session(self, session_id: str, reason: str) -> None:
        self._api.end_session(session_id, reason)

    # ------------------------------------------------------------------
    # Sender thread
    # ------------------------------------------------------------------

    def _start_sender(self) -> None:
        self._stop_event.clear()
        self._sender = threading.Thread(
            target=self._sender_loop, name="subl-metrics-sender", daemon=True
        )
        self._sender.start()

    def _heartbeat(self) -> None:
        """Tell the backend the agent is alive, even with no keystrokes/while
        paused, so the device stays 'online' and claimable."""
        if not self._device_id:
            return
        try:
            self._api.ping_device(self._device_id)
        except Exception:  # noqa: BLE001
            log.debug("Heartbeat ping failed", exc_info=True)

    def _sender_loop(self) -> None:
        log.info("Metrics sender started (interval=%ss)", self._batch_interval_seconds)
        while not self._stop_event.wait(self._batch_interval_seconds):
            # Heartbeat regardless of typing or pause state so liveness reflects
            # the running agent process, not just session activity.
            self._heartbeat()
            if self._is_paused:
                continue
            try:
                self._send_one_batch()
            except Exception as ex:  # noqa: BLE001
                log.exception("Failed to submit metrics")
                if self._on_error:
                    try:
                        self._on_error(ex)
                    except Exception:  # noqa: BLE001
                        log.exception("on_error callback raised")

    def _send_one_batch(self) -> None:
        if not self._session_id:
            return
        features = self._monitor.collect_features(reset=True)
        if features is None:
            log.debug("No keystrokes this window, skipping submit")
            return

        payload = {k: v for k, v in features.items() if not k.startswith("_")}
        payload["deleteCount"] = features.get("_deleteCount", 0)
        payload["capturedAt"] = datetime.now(timezone.utc).isoformat()

        log.info("Submitting batch: %s", payload)
        try:
            reading = self._api.submit_metrics(self._session_id, payload)
        except ApiError as ex:
            if ex.status in (404, 409):
                log.warning("Session no longer accepts metrics: %s", ex)
                # Self-heal: the server-side session expired/ended (abandoned
                # after inactivity, or re-claimed by another user). Start a fresh
                # session and keep monitoring. The keyboard monitor is already
                # running, so we only re-acquire a session id. If the restart
                # itself fails, keep the loop alive and retry on the next tick
                # instead of permanently stopping the agent.
                if self._auto_restart and self._device_id and not self._stop_event.is_set():
                    try:
                        new_id = self._api.start_session(
                            self._device_id, "auto-restart after session expiry")
                        self._session_id = new_id
                        self._is_paused = False
                        log.info("Auto-restarted stress session: %s", new_id)
                    except ApiError as restart_ex:
                        log.warning("Auto-restart failed; will retry next tick: %s", restart_ex)
                return  # drop this window; next tick uses the new/retried session
            raise

        if self._on_reading:
            enriched = Reading(
                score=reading.score,
                level=reading.level,
                confidence=reading.confidence,
                keystroke_count=features.get("nKeys", 0),
                delete_count=features.get("_deleteCount", 0),
                at=time.time(),
            )
            try:
                self._on_reading(enriched)
            except Exception:  # noqa: BLE001
                log.exception("on_reading callback raised")

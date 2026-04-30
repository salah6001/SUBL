"""Desktop keyboard agent for MindType AI.

This agent captures global keyboard timings and sends feature payloads
to the FastAPI backend `/predict` endpoint.
"""

import argparse
import json
import math
import sys
import time
from collections import deque
from typing import Dict, Optional

import requests
from pynput import keyboard

DELETE_KEYS = {"backspace", "delete"}


def _to_key_name(key) -> str:
    try:
        return key.char.lower()
    except AttributeError:
        return str(key).replace('Key.', '').lower()


def median(values):
    values = sorted(values)
    if not values:
        return 0.0
    mid = len(values) // 2
    if len(values) % 2:
        return values[mid]
    return (values[mid - 1] + values[mid]) / 2.0


def coefficient_of_variation(values):
    if not values:
        return 0.0
    mean = sum(values) / len(values)
    if mean == 0:
        return 0.0
    variance = sum((x - mean) ** 2 for x in values) / len(values)
    return round(math.sqrt(variance) / mean, 3)


class KeystrokeAgent:
    def __init__(self, backend_url: str, min_keys: int = 20, max_duration: int = 15):
        self.backend_url = backend_url.rstrip('/')
        self.min_keys = max(min_keys, 10)
        self.max_duration = max(max_duration, 5)
        self.reset()

    def reset(self):
        self.start_time: Optional[float] = None
        self.last_down_time: Optional[float] = None
        self.key_down_times = {}
        self.flight_times = []
        self.dwell_times = []
        self.delete_count = 0
        self.key_count = 0

    def add_keydown(self, key_name: str, timestamp: float):
        if self.start_time is None:
            self.start_time = timestamp

        if self.last_down_time is not None:
            self.flight_times.append(timestamp - self.last_down_time)

        self.last_down_time = timestamp
        self.key_down_times[key_name] = timestamp
        self.key_count += 1

        if key_name in DELETE_KEYS:
            self.delete_count += 1

    def add_keyup(self, key_name: str, timestamp: float):
        down_ts = self.key_down_times.pop(key_name, None)
        if down_ts is not None:
            self.dwell_times.append(timestamp - down_ts)

    def should_send(self) -> bool:
        if self.start_time is None:
            return False
        elapsed = time.time() - self.start_time
        return self.key_count >= self.min_keys or elapsed >= self.max_duration

    def compute_features(self) -> Dict[str, float]:
        duration_ms = max((time.time() - self.start_time) * 1000.0, 1.0)
        return {
            "mean_dwell": round((sum(self.dwell_times) / len(self.dwell_times)) * 1000.0, 3)
            if self.dwell_times else 0.0,
            "median_flight": round(median([f * 1000.0 for f in self.flight_times]), 3) if self.flight_times else 0.0,
            "cv_flight": coefficient_of_variation([f * 1000.0 for f in self.flight_times]),
            "mean_del_freq": round((self.delete_count / max(self.key_count, 1)) * 100.0, 3),
            "mean_tot_time": round(duration_ms, 3),
        }

    def send_payload(self, features: Dict[str, float]):
        payload = {**features}
        print("[MindType Agent] Sending payload:", json.dumps(payload, indent=2))
        try:
            response = requests.post(f"{self.backend_url}/predict", json=payload, timeout=8)
            response.raise_for_status()
            print("[MindType Agent] Response:", json.dumps(response.json(), indent=2, ensure_ascii=False))
        except Exception as exc:
            print(f"[MindType Agent] Failed to send payload: {exc}")

    def run(self):
        print("[MindType Agent] Starting global keyboard listener...")
        print("Press ESC to stop the agent.")

        def on_press(key):
            key_name = _to_key_name(key)
            self.add_keydown(key_name, time.time())
            if self.should_send():
                features = self.compute_features()
                self.send_payload(features)
                self.reset()

        def on_release(key):
            key_name = _to_key_name(key)
            self.add_keyup(key_name, time.time())
            if key_name == "esc":
                print("[MindType Agent] Stopping...")
                return False

        with keyboard.Listener(on_press=on_press, on_release=on_release) as listener:
            listener.join()


def parse_args():
    parser = argparse.ArgumentParser(description="MindType AI desktop keyboard agent")
    parser.add_argument("--backend", default="http://localhost:8000", help="FastAPI backend URL")
    parser.add_argument("--min-keys", type=int, default=20, help="Minimum keys before sending features")
    parser.add_argument("--window", type=int, default=15, help="Maximum seconds to collect keys before sending")
    return parser.parse_args()


def main():
    args = parse_args()
    agent = KeystrokeAgent(backend_url=args.backend, min_keys=args.min_keys, max_duration=args.window)
    try:
        agent.run()
    except KeyboardInterrupt:
        print("[MindType Agent] Interrupted by user.")


if __name__ == "__main__":
    main()

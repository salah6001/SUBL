"""File-backed device store."""

import json
from pathlib import Path
from typing import Optional

from subl_agent.application.ports import DeviceStore


class FileDeviceStore(DeviceStore):
    def __init__(self, device_file: Path) -> None:
        self._device_file = device_file

    def load_device_id(self) -> Optional[str]:
        if not self._device_file.exists():
            return None
        try:
            data = json.loads(self._device_file.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return None
        return data.get("deviceId")

    def save_device_id(self, device_id: str) -> None:
        self._device_file.write_text(
            json.dumps({"deviceId": device_id}), encoding="utf-8"
        )

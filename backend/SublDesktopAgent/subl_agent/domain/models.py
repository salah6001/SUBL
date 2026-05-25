"""Domain models."""

from dataclasses import dataclass


@dataclass(frozen=True)
class DeviceProfile:
    name: str
    fingerprint: str
    platform: str
    os_version: str
    agent_version: str

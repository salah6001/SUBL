"""Configuration for the agent."""

import os
import platform
import uuid
from dataclasses import dataclass
from pathlib import Path

from subl_agent.domain.models import DeviceProfile


@dataclass(frozen=True)
class Settings:
    api_base_url: str
    webhook_url: str
    webhook_secret: str
    # Optional credentials so a long-running headless agent can re-login on its
    # own when its refresh token lapses, instead of silently going idle.
    email: str
    password: str
    batch_interval_seconds: int
    max_reasonable_flight_ms: int
    min_keystrokes_per_batch: int
    data_dir: Path
    token_file: Path
    device_file: Path
    agent_version: str


def load_settings() -> Settings:
    api_base_url = os.environ.get("SUBL_API_URL", "http://localhost:5000")
    webhook_url = os.environ.get("SUBL_WEBHOOK_URL", "").strip()
    webhook_secret = os.environ.get("SUBL_WEBHOOK_SECRET", "")
    if not webhook_url:
        webhook_url = f"{api_base_url.rstrip('/')}/webhooks/stress-sessions"

    email = os.environ.get("SUBL_EMAIL", "")
    password = os.environ.get("SUBL_PASSWORD", "")
    batch_interval_seconds = int(os.environ.get("SUBL_BATCH_INTERVAL", "300"))
    max_reasonable_flight_ms = 2000
    min_keystrokes_per_batch = 5
    data_dir = Path(os.environ.get("SUBL_DATA_DIR", str(Path.home() / ".subl_agent")))
    data_dir = data_dir.expanduser()
    data_dir.mkdir(parents=True, exist_ok=True)
    token_file = data_dir / "auth.json"
    device_file = data_dir / "device.json"
    agent_version = "1.0.0"

    return Settings(
        api_base_url=api_base_url,
        webhook_url=webhook_url,
        webhook_secret=webhook_secret,
        email=email,
        password=password,
        batch_interval_seconds=batch_interval_seconds,
        max_reasonable_flight_ms=max_reasonable_flight_ms,
        min_keystrokes_per_batch=min_keystrokes_per_batch,
        data_dir=data_dir,
        token_file=token_file,
        device_file=device_file,
        agent_version=agent_version,
    )


def get_device_fingerprint(data_dir: Path | None = None) -> str:
    # An explicit override is the most reliable identity in environments where
    # the host name and MAC are not stable (e.g. a container that gets a fresh
    # random hostname + MAC on every restart, which would otherwise mint a new
    # device row each time).
    override = os.environ.get("SUBL_DEVICE_FINGERPRINT", "").strip()
    if override:
        return override

    # Otherwise persist a generated UUID next to the agent's data so the same
    # install keeps the same identity across restarts, independent of the host
    # name / MAC. Falls back to the host-derived value only as a last resort.
    if data_dir is not None:
        fp_file = data_dir / "fingerprint.txt"
        try:
            if fp_file.exists():
                stored = fp_file.read_text(encoding="utf-8").strip()
                if stored:
                    return stored
            generated = f"{get_default_device_name()}-{uuid.uuid4()}"
            fp_file.write_text(generated, encoding="utf-8")
            return generated
        except OSError:
            pass

    return f"{platform.node()}-{uuid.getnode()}"


def get_platform_name() -> str:
    system = platform.system()
    if system == "Windows":
        return "Windows"
    if system == "Darwin":
        return "MacOS"
    return "Linux"


def get_os_version() -> str:
    return f"{platform.system()} {platform.release()}"


def get_default_device_name() -> str:
    override = os.environ.get("SUBL_DEVICE_NAME", "").strip()
    if override:
        return override
    return f"{platform.node()}'s {get_platform_name()}"


def build_device_profile(settings: Settings) -> DeviceProfile:
    return DeviceProfile(
        name=get_default_device_name(),
        fingerprint=get_device_fingerprint(settings.data_dir),
        platform=get_platform_name(),
        os_version=get_os_version(),
        agent_version=settings.agent_version,
    )

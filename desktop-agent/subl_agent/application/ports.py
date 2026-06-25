"""Port definitions for clean architecture boundaries."""

from typing import Optional, Protocol

from subl_agent.application.dtos import EmotionResult, Reading, SessionInfo, Tokens
from subl_agent.domain.models import DeviceProfile


class ApiGateway(Protocol):
    def is_authenticated(self) -> bool:
        ...

    def login(self, email: str, password: str) -> Tokens:
        ...

    def logout(self) -> None:
        ...

    def register_device(self, profile: DeviceProfile) -> str:
        ...

    def ping_device(self, device_id: str) -> None:
        ...

    def start_session(self, device_id: str, notes: Optional[str]) -> str:
        ...

    def pause_session(self, session_id: str) -> None:
        ...

    def resume_session(self, session_id: str) -> None:
        ...

    def end_session(self, session_id: str, reason: Optional[str]) -> None:
        ...

    def submit_metrics(self, session_id: str, features: dict) -> Reading:
        ...

    def analyze_emotion(self, text: str, session_id: Optional[str]) -> EmotionResult:
        ...

    def get_active_session(self) -> Optional[SessionInfo]:
        ...


class TokenStore(Protocol):
    def load_tokens(self) -> Optional[Tokens]:
        ...

    def save_tokens(self, tokens: Tokens) -> None:
        ...

    def clear_tokens(self) -> None:
        ...


class DeviceStore(Protocol):
    def load_device_id(self) -> Optional[str]:
        ...

    def save_device_id(self, device_id: str) -> None:
        ...


class KeyboardMonitor(Protocol):
    def start(self) -> None:
        ...

    def stop(self) -> None:
        ...

    def collect_features(self, reset: bool = True) -> Optional[dict]:
        ...

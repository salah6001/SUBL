"""Data transfer objects shared across layers."""

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class Tokens:
    access_token: str
    refresh_token: str


@dataclass(frozen=True)
class SessionInfo:
    id: str
    is_paused: bool
    started_at: Optional[str] = None


@dataclass(frozen=True)
class Reading:
    score: float
    level: str
    confidence: float
    keystroke_count: int = 0
    delete_count: int = 0
    at: float = 0.0


@dataclass(frozen=True)
class EmotionResult:
    emotion: str
    confidence: float

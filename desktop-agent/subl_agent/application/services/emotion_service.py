"""Emotion analysis service."""

from typing import Optional

from subl_agent.application.dtos import EmotionResult
from subl_agent.application.ports import ApiGateway


class EmotionService:
    def __init__(self, api: ApiGateway) -> None:
        self._api = api

    def analyze(self, text: str, session_id: Optional[str] = None) -> EmotionResult:
        return self._api.analyze_emotion(text=text, session_id=session_id)

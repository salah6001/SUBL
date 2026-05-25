"""HTTP client for the SUBL .NET backend."""

import hashlib
import hmac
import json
import time
from typing import Any, Optional

import requests

from subl_agent.application.dtos import EmotionResult, Reading, SessionInfo, Tokens
from subl_agent.application.errors import ApiError
from subl_agent.application.ports import ApiGateway, TokenStore
from subl_agent.domain.models import DeviceProfile


class HttpApiClient(ApiGateway):
    def __init__(
        self,
        base_url: str,
        token_store: TokenStore,
        webhook_url: Optional[str] = None,
        webhook_secret: Optional[str] = None,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._webhook_url = (webhook_url or "").rstrip("/")
        self._webhook_secret = webhook_secret or ""
        self._token_store = token_store
        self._access_token: Optional[str] = None
        self._refresh_token: Optional[str] = None
        self._load_tokens()

    # ------------------------------------------------------------------
    # Token persistence
    # ------------------------------------------------------------------

    def _load_tokens(self) -> None:
        tokens = self._token_store.load_tokens()
        if tokens is None:
            return
        self._access_token = tokens.access_token
        self._refresh_token = tokens.refresh_token

    def _save_tokens(self, access_token: str, refresh_token: str) -> None:
        self._access_token = access_token
        self._refresh_token = refresh_token
        self._token_store.save_tokens(Tokens(access_token, refresh_token))

    def _clear_tokens(self) -> None:
        self._access_token = None
        self._refresh_token = None
        self._token_store.clear_tokens()

    def is_authenticated(self) -> bool:
        return self._access_token is not None

    # ------------------------------------------------------------------
    # Low-level request helpers
    # ------------------------------------------------------------------

    def _request(
        self, method: str, path: str, *, json_body: Any = None, params: Any = None
    ) -> Optional[dict]:
        url = f"{self._base_url}{path}"
        headers = {"Content-Type": "application/json"}
        if self._access_token:
            headers["Authorization"] = f"Bearer {self._access_token}"

        response = requests.request(
            method, url, headers=headers, json=json_body, params=params, timeout=15
        )

        if response.status_code == 401 and self._refresh_token and self._refresh():
            headers["Authorization"] = f"Bearer {self._access_token}"
            response = requests.request(
                method, url, headers=headers, json=json_body, params=params, timeout=15
            )

        if not response.ok:
            try:
                payload = response.json()
                detail = payload.get("detail") or payload.get("title") or response.text
            except (ValueError, json.JSONDecodeError):
                detail = response.text
            raise ApiError(response.status_code, detail)

        if response.status_code == 204 or not response.content:
            return None
        return response.json()

    def _refresh(self) -> bool:
        try:
            response = requests.post(
                f"{self._base_url}/users/refresh-token",
                json={"refreshToken": self._refresh_token},
                timeout=10,
            )
            if response.ok:
                data = response.json()
                self._save_tokens(data["accessToken"], data["refreshToken"])
                return True
        except requests.RequestException:
            pass
        self._clear_tokens()
        return False

    # ------------------------------------------------------------------
    # Auth
    # ------------------------------------------------------------------

    def login(self, email: str, password: str) -> Tokens:
        response = requests.post(
            f"{self._base_url}/users/login",
            json={"email": email, "password": password},
            timeout=15,
        )
        if not response.ok:
            try:
                detail = response.json().get("detail") or response.text
            except ValueError:
                detail = response.text
            raise ApiError(response.status_code, detail)
        data = response.json()
        self._save_tokens(data["accessToken"], data["refreshToken"])
        return Tokens(data["accessToken"], data["refreshToken"])

    def logout(self) -> None:
        try:
            self._request("POST", "/users/logout")
        except ApiError:
            pass
        finally:
            self._clear_tokens()

    # ------------------------------------------------------------------
    # Devices
    # ------------------------------------------------------------------

    def register_device(self, profile: DeviceProfile) -> str:
        result = self._request(
            "POST",
            "/devices",
            json_body={
                "deviceName": profile.name,
                "deviceFingerprint": profile.fingerprint,
                "platform": profile.platform,
                "osVersion": profile.os_version,
                "agentVersion": profile.agent_version,
            },
        )
        return result["id"]

    # ------------------------------------------------------------------
    # Sessions
    # ------------------------------------------------------------------

    def start_session(self, device_id: str, notes: Optional[str]) -> str:
        result = self._request(
            "POST",
            "/stress-sessions/start",
            json_body={"deviceId": device_id, "notes": notes},
        )
        return result["id"]

    def end_session(self, session_id: str, reason: Optional[str]) -> None:
        self._request(
            "POST",
            f"/stress-sessions/{session_id}/end",
            json_body={"reason": reason},
        )

    def pause_session(self, session_id: str) -> None:
        self._request("POST", f"/stress-sessions/{session_id}/pause")

    def resume_session(self, session_id: str) -> None:
        self._request("POST", f"/stress-sessions/{session_id}/resume")

    def get_active_session(self) -> Optional[SessionInfo]:
        try:
            payload = self._request("GET", "/stress-sessions/active")
        except ApiError as ex:
            if ex.status == 204:
                return None
            raise
        if not payload:
            return None
        return SessionInfo(
            id=payload.get("id") or payload.get("sessionId"),
            is_paused=bool(payload.get("isPaused", False)),
            started_at=payload.get("startedAt"),
        )

    # ------------------------------------------------------------------
    # Metrics
    # ------------------------------------------------------------------

    def submit_metrics(self, session_id: str, features: dict) -> Reading:
        if self._webhook_url:
            return self._submit_metrics_webhook(session_id, features)

        payload = self._request(
            "POST",
            f"/stress-sessions/{session_id}/metrics",
            json_body=features,
        )
        if not payload:
            return Reading(score=0.0, level="-", confidence=0.0)
        return Reading(
            score=float(payload.get("score", 0.0)),
            level=str(payload.get("level", "-")),
            confidence=float(payload.get("confidence", 0.0)),
        )

    def _submit_metrics_webhook(self, session_id: str, features: dict) -> Reading:
        if not self._webhook_secret:
            raise ApiError(500, "Webhook secret is not configured")

        url = f"{self._webhook_url}/{session_id}/metrics"
        body = json.dumps(features, separators=(",", ":"), ensure_ascii=True)
        timestamp = str(int(time.time()))
        signature = self._sign_webhook(timestamp, body)

        headers = {
            "Content-Type": "application/json",
            "X-Webhook-Timestamp": timestamp,
            "X-Webhook-Signature": signature,
        }

        response = requests.post(url, data=body, headers=headers, timeout=15)

        if not response.ok:
            try:
                payload = response.json()
                detail = payload.get("detail") or payload.get("title") or response.text
            except (ValueError, json.JSONDecodeError):
                detail = response.text
            raise ApiError(response.status_code, detail)

        if response.status_code == 204 or not response.content:
            return Reading(score=0.0, level="-", confidence=0.0)

        payload = response.json()
        return Reading(
            score=float(payload.get("score", 0.0)),
            level=str(payload.get("level", "-")),
            confidence=float(payload.get("confidence", 0.0)),
        )

    def _sign_webhook(self, timestamp: str, body: str) -> str:
        message = f"{timestamp}.{body}".encode("utf-8")
        secret = self._webhook_secret.encode("utf-8")
        return hmac.new(secret, message, hashlib.sha256).hexdigest()

    # ------------------------------------------------------------------
    # Emotion
    # ------------------------------------------------------------------

    def analyze_emotion(self, text: str, session_id: Optional[str]) -> EmotionResult:
        payload = self._request(
            "POST",
            "/emotion/analyze",
            json_body={"text": text, "sessionId": session_id},
        )
        if not payload:
            return EmotionResult(emotion="?", confidence=0.0)
        emotion = payload.get("emotion") or payload.get("label") or "?"
        confidence = float(payload.get("confidence", 0.0))
        return EmotionResult(emotion=emotion, confidence=confidence)

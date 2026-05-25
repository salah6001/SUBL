"""Application bootstrap for the SUBL Desktop Agent."""

from subl_agent.application.services.auth_service import AuthService
from subl_agent.application.services.emotion_service import EmotionService
from subl_agent.application.services.session_service import SessionService
from subl_agent.infrastructure.api.http_api_client import HttpApiClient
from subl_agent.infrastructure.config.settings import build_device_profile, load_settings
from subl_agent.infrastructure.keyboard.pynput_monitor import PynputKeyboardMonitor
from subl_agent.infrastructure.storage.file_device_store import FileDeviceStore
from subl_agent.infrastructure.storage.file_token_store import FileTokenStore
from subl_agent.presentation.qt.app import run_qt_app


def run() -> None:
    settings = load_settings()

    token_store = FileTokenStore(settings.token_file)
    device_store = FileDeviceStore(settings.device_file)
    api = HttpApiClient(
        settings.api_base_url,
        token_store,
        webhook_url=settings.webhook_url,
        webhook_secret=settings.webhook_secret,
    )
    monitor = PynputKeyboardMonitor(
        max_reasonable_flight_ms=settings.max_reasonable_flight_ms,
        min_keystrokes_per_batch=settings.min_keystrokes_per_batch,
    )
    device_profile = build_device_profile(settings)

    session_service = SessionService(
        api=api,
        monitor=monitor,
        device_store=device_store,
        device_profile=device_profile,
        batch_interval_seconds=settings.batch_interval_seconds,
    )
    auth_service = AuthService(api)
    emotion_service = EmotionService(api)

    run_qt_app(
        auth_service=auth_service,
        session_service=session_service,
        emotion_service=emotion_service,
        settings=settings,
    )

"""Application bootstrap for the SUBL Desktop Agent."""

import logging
import os
import signal
import threading

from subl_agent.application.errors import ApiError
from subl_agent.application.services.auth_service import AuthService
from subl_agent.application.services.emotion_service import EmotionService
from subl_agent.application.services.session_service import SessionService
from subl_agent.infrastructure.api.http_api_client import HttpApiClient
from subl_agent.infrastructure.config.settings import build_device_profile, load_settings
from subl_agent.infrastructure.keyboard.pynput_monitor import PynputKeyboardMonitor
from subl_agent.infrastructure.storage.file_device_store import FileDeviceStore
from subl_agent.infrastructure.storage.file_token_store import FileTokenStore

log = logging.getLogger(__name__)


def _build_services():
    settings = load_settings()

    token_store  = FileTokenStore(settings.token_file)
    device_store = FileDeviceStore(settings.device_file)
    api = HttpApiClient(
        settings.api_base_url,
        token_store,
        webhook_url=settings.webhook_url,
        webhook_secret=settings.webhook_secret,
        email=settings.email,
        password=settings.password,
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
    auth_service  = AuthService(api)
    emotion_service = EmotionService(api)

    return settings, auth_service, session_service, emotion_service


def run() -> None:
    settings, auth_service, session_service, emotion_service = _build_services()

    from subl_agent.presentation.qt.app import run_qt_app
    run_qt_app(
        auth_service=auth_service,
        session_service=session_service,
        emotion_service=emotion_service,
        settings=settings,
    )


def run_headless() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    )

    settings, auth_service, session_service, _ = _build_services()

    # Authenticate — use stored token or fall back to env-var credentials
    if not auth_service.is_authenticated():
        email    = os.environ.get("SUBL_EMAIL")
        password = os.environ.get("SUBL_PASSWORD")
        if not email or not password:
            log.error(
                "Not authenticated. Set SUBL_EMAIL and SUBL_PASSWORD, "
                "or run the GUI once to store a token."
            )
            raise SystemExit(1)
        try:
            auth_service.login(email, password)
            log.info("Logged in as %s", email)
        except ApiError as exc:
            log.error("Login failed: %s", exc.detail)
            raise SystemExit(1)

    # Start the session — but first reattach to any session that survived a
    # previous run (a restart leaves the server-side session active, so blindly
    # starting a new one fails with "you already have an active session").
    try:
        existing = session_service.get_active_session()
        if existing is not None:
            session_service.attach(existing.id, is_paused=existing.is_paused)
            log.info("Reattached to active session: %s", existing.id)
        else:
            session_id = session_service.start(notes="Headless agent session")
            log.info("Session started: %s", session_id)
        log.info("Monitoring keystrokes. Press Ctrl+C or send SIGTERM to stop.")
    except ApiError as exc:
        log.error("Failed to start session: %s", exc.detail)
        raise SystemExit(1)

    # Block until SIGINT / SIGTERM
    stop_event = threading.Event()

    def _shutdown(sig, frame):
        log.info("Signal %s received — stopping...", sig)
        stop_event.set()

    signal.signal(signal.SIGINT,  _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)

    stop_event.wait()

    session_service.stop("Headless agent stopped")
    log.info("Done.")

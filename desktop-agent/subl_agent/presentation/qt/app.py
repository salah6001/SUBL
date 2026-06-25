"""Qt application entry point."""

import logging
import threading
from datetime import datetime
from typing import Optional

from PySide6.QtCore import QObject, Signal
from PySide6.QtGui import QFont
from PySide6.QtWidgets import QApplication, QMainWindow, QMessageBox, QStackedWidget

from subl_agent.application.dtos import EmotionResult, Reading, SessionInfo
from subl_agent.application.errors import ApiError
from subl_agent.application.services.auth_service import AuthService
from subl_agent.application.services.emotion_service import EmotionService
from subl_agent.application.services.session_service import SessionService
from subl_agent.infrastructure.config.settings import Settings
from subl_agent.presentation.qt.styles import APP_STYLES, LEVEL_COLORS
from subl_agent.presentation.qt.views import DashboardView, LoginView

log = logging.getLogger(__name__)


class UiSignals(QObject):
    login_success = Signal()
    login_failed = Signal(str)
    status_update = Signal(str)
    reading_update = Signal(object)
    session_started = Signal(str)
    session_stopped = Signal()
    session_state = Signal(object)
    active_session = Signal(object)
    emotion_result = Signal(str)
    show_login = Signal()


class SublAgentWindow(QMainWindow):
    def __init__(
        self,
        auth_service: AuthService,
        session_service: SessionService,
        emotion_service: EmotionService,
        settings: Settings,
    ) -> None:
        super().__init__()
        self._auth_service = auth_service
        self._session_service = session_service
        self._emotion_service = emotion_service
        self._settings = settings
        self._signals = UiSignals()

        self._signals.login_success.connect(self._on_login_success)
        self._signals.login_failed.connect(self._on_login_failed)
        self._signals.status_update.connect(self._on_status_update)
        self._signals.reading_update.connect(self._on_reading_update)
        self._signals.session_started.connect(self._on_session_started)
        self._signals.session_stopped.connect(self._on_session_stopped)
        self._signals.session_state.connect(self._on_session_state)
        self._signals.active_session.connect(self._on_active_session)
        self._signals.emotion_result.connect(self._on_emotion_result)
        self._signals.show_login.connect(self._show_login)

        self._session_service.set_callbacks(
            on_reading=lambda reading: self._signals.reading_update.emit(reading),
            on_error=self._handle_service_error,
            on_session_ended=lambda: self._signals.session_stopped.emit(),
        )

        self.setWindowTitle("SUBL Stress Detection Agent")
        self.setMinimumSize(720, 760)

        self._stack = QStackedWidget()
        self.login_view = LoginView()
        self.dashboard_view = DashboardView()

        self._stack.addWidget(self.login_view)
        self._stack.addWidget(self.dashboard_view)
        self.setCentralWidget(self._stack)

        self.login_view.login_requested.connect(self._handle_login)
        self.dashboard_view.start_requested.connect(self._handle_start)
        self.dashboard_view.pause_requested.connect(self._handle_pause)
        self.dashboard_view.stop_requested.connect(self._handle_stop)
        self.dashboard_view.analyze_requested.connect(self._handle_analyze)
        self.dashboard_view.logout_requested.connect(self._handle_logout)

        self.dashboard_view.set_batch_info(settings.batch_interval_seconds)
        self.login_view.set_version(settings.agent_version)

        if self._auth_service.is_authenticated():
            self._show_dashboard()
            self._check_active_session()
        else:
            self._show_login()

    # ------------------------------------------------------------------
    # UI routing
    # ------------------------------------------------------------------

    def _show_login(self) -> None:
        self.login_view.set_status("", is_error=False)
        self.login_view.set_loading(False)
        self._stack.setCurrentWidget(self.login_view)

    def _show_dashboard(self) -> None:
        self.dashboard_view.set_status("Idle")
        self._stack.setCurrentWidget(self.dashboard_view)

    # ------------------------------------------------------------------
    # Background helpers
    # ------------------------------------------------------------------

    def _run_in_thread(self, target) -> None:
        thread = threading.Thread(target=target, daemon=True)
        thread.start()

    def _handle_service_error(self, ex: Exception) -> None:
        if isinstance(ex, ApiError):
            message = ex.detail
        else:
            message = str(ex)
        self._signals.status_update.emit(f"Error: {message}")

    # ------------------------------------------------------------------
    # Login
    # ------------------------------------------------------------------

    def _handle_login(self, email: str, password: str) -> None:
        if not email or not password:
            self.login_view.set_status("Please fill in both fields.", is_error=True)
            return
        self.login_view.set_status("Signing in...", is_error=False)
        self.login_view.set_loading(True)

        def worker() -> None:
            try:
                self._auth_service.login(email, password)
            except ApiError as ex:
                self._signals.login_failed.emit(ex.detail)
            except Exception as ex:  # noqa: BLE001
                self._signals.login_failed.emit(str(ex))
            else:
                self._signals.login_success.emit()

        self._run_in_thread(worker)

    def _on_login_success(self) -> None:
        self.login_view.set_loading(False)
        self.login_view.clear()
        self._show_dashboard()
        self._check_active_session()

    def _on_login_failed(self, message: str) -> None:
        self.login_view.set_loading(False)
        self.login_view.set_status(f"Login failed: {message}", is_error=True)

    # ------------------------------------------------------------------
    # Active session recovery
    # ------------------------------------------------------------------

    def _check_active_session(self) -> None:
        def worker() -> None:
            try:
                session = self._session_service.get_active_session()
            except ApiError as ex:
                self._signals.status_update.emit(f"Error: {ex.detail}")
                return
            except Exception as ex:  # noqa: BLE001
                self._signals.status_update.emit(f"Error: {ex}")
                return
            self._signals.active_session.emit(session)

        self._run_in_thread(worker)

    def _on_active_session(self, session: Optional[SessionInfo]) -> None:
        if session is None or not session.id:
            return

        dialog = QMessageBox(self)
        dialog.setWindowTitle("Active session found")
        dialog.setText("An active session is already running. Resume it?")
        resume_btn = dialog.addButton("Resume", QMessageBox.AcceptRole)
        end_btn = dialog.addButton("End Session", QMessageBox.DestructiveRole)
        ignore_btn = dialog.addButton("Ignore", QMessageBox.RejectRole)
        dialog.exec()

        clicked = dialog.clickedButton()
        if clicked == resume_btn:
            self._attach_session(session)
        elif clicked == end_btn:
            self._end_remote_session(session.id)
        elif clicked == ignore_btn:
            self.dashboard_view.set_status("Idle")

    def _attach_session(self, session: SessionInfo) -> None:
        self._session_service.attach(session.id, is_paused=session.is_paused)
        self.dashboard_view.set_session_state(True, session.is_paused, session.id)
        if session.is_paused:
            self.dashboard_view.set_status("Paused")
        else:
            self.dashboard_view.set_status("Monitoring keyboard activity")

    def _end_remote_session(self, session_id: str) -> None:
        self.dashboard_view.set_status("Ending session...")

        def worker() -> None:
            try:
                self._session_service.end_remote_session(
                    session_id, "User ended session from agent"
                )
            except ApiError as ex:
                self._signals.status_update.emit(f"Error: {ex.detail}")
            except Exception as ex:  # noqa: BLE001
                self._signals.status_update.emit(f"Error: {ex}")
            else:
                self._signals.status_update.emit("Session ended")

        self._run_in_thread(worker)

    # ------------------------------------------------------------------
    # Session actions
    # ------------------------------------------------------------------

    def _handle_start(self) -> None:
        self.dashboard_view.set_status("Registering device...")
        self.dashboard_view.start_button.setEnabled(False)

        def worker() -> None:
            try:
                session_id = self._session_service.start()
            except ApiError as ex:
                self._signals.status_update.emit(f"Error: {ex.detail}")
                self._signals.session_stopped.emit()
            except Exception as ex:  # noqa: BLE001
                self._signals.status_update.emit(f"Error: {ex}")
                self._signals.session_stopped.emit()
            else:
                self._signals.session_started.emit(session_id)

        self._run_in_thread(worker)

    def _on_session_started(self, session_id: str) -> None:
        self.dashboard_view.set_status("Monitoring keyboard activity")
        self.dashboard_view.set_session_state(True, False, session_id)

    def _handle_pause(self) -> None:
        if not self._session_service.is_running:
            return

        def worker() -> None:
            try:
                if self._session_service.is_paused:
                    self._session_service.resume()
                else:
                    self._session_service.pause()
            except ApiError as ex:
                self._signals.status_update.emit(f"Error: {ex.detail}")
            except Exception as ex:  # noqa: BLE001
                self._signals.status_update.emit(f"Error: {ex}")
            else:
                is_paused = self._session_service.is_paused
                self._signals.status_update.emit(
                    "Paused" if is_paused else "Monitoring keyboard activity"
                )
                self._signals.session_state.emit(
                    (True, is_paused, self._session_service.session_id)
                )

        self._run_in_thread(worker)

    def _handle_stop(self) -> None:
        if not self._session_service.is_running:
            return
        self.dashboard_view.set_status("Ending session...")

        def worker() -> None:
            try:
                self._session_service.stop("User ended session from agent")
            except Exception as ex:  # noqa: BLE001
                self._signals.status_update.emit(f"Error: {ex}")
            finally:
                self._signals.session_stopped.emit()

        self._run_in_thread(worker)

    def _on_session_stopped(self) -> None:
        self.dashboard_view.set_status("Idle")
        self.dashboard_view.set_session_state(False, False, None)

    def _on_session_state(self, payload: tuple) -> None:
        is_running, is_paused, session_id = payload
        self.dashboard_view.set_session_state(is_running, is_paused, session_id)

    # ------------------------------------------------------------------
    # Readings
    # ------------------------------------------------------------------

    def _on_reading_update(self, reading: Reading) -> None:
        level = reading.level or "-"
        color = LEVEL_COLORS.get(level, "#0f172a")
        timestamp = datetime.fromtimestamp(reading.at).strftime("%H:%M:%S")
        self.dashboard_view.set_reading(
            level=level,
            score=reading.score,
            confidence=reading.confidence,
            keystrokes=reading.keystroke_count,
            last_update=timestamp,
            color=color,
        )

    # ------------------------------------------------------------------
    # Emotion
    # ------------------------------------------------------------------

    def _handle_analyze(self, text: str) -> None:
        if not text:
            self.dashboard_view.set_emotion_result("Please type something first.")
            return
        self.dashboard_view.set_emotion_result("Analyzing...")

        def worker() -> None:
            try:
                result = self._emotion_service.analyze(
                    text=text, session_id=self._session_service.session_id
                )
            except ApiError as ex:
                self._signals.emotion_result.emit(f"Could not analyze: {ex.detail}")
            except Exception as ex:  # noqa: BLE001
                self._signals.emotion_result.emit(f"Error: {ex}")
            else:
                message = (
                    f"Detected emotion: {result.emotion} "
                    f"(confidence {result.confidence:.0%})"
                )
                self._signals.emotion_result.emit(message)

        self._run_in_thread(worker)

    def _on_emotion_result(self, message: str) -> None:
        self.dashboard_view.set_emotion_result(message)

    # ------------------------------------------------------------------
    # Logout
    # ------------------------------------------------------------------

    def _handle_logout(self) -> None:
        if self._session_service.is_running:
            confirm = QMessageBox.question(
                self,
                "End session?",
                "Signing out will end the current session. Continue?",
            )
            if confirm != QMessageBox.Yes:
                return

        self.dashboard_view.set_status("Signing out...")

        def worker() -> None:
            try:
                if self._session_service.is_running:
                    self._session_service.stop("User signed out")
            except Exception:  # noqa: BLE001
                log.exception("Error ending session on sign-out")
            finally:
                self._auth_service.logout()
                self._signals.session_stopped.emit()
                self._signals.show_login.emit()

        self._run_in_thread(worker)

    # ------------------------------------------------------------------
    # Status
    # ------------------------------------------------------------------

    def _on_status_update(self, message: str) -> None:
        self.dashboard_view.set_status(message)

    # ------------------------------------------------------------------
    # Window lifecycle
    # ------------------------------------------------------------------

    def closeEvent(self, event) -> None:  # noqa: N802
        if self._session_service.is_running:
            try:
                self._session_service.stop("Agent closed")
            except Exception:  # noqa: BLE001
                log.exception("Error ending session on close")
        event.accept()


def run_qt_app(
    auth_service: AuthService,
    session_service: SessionService,
    emotion_service: EmotionService,
    settings: Settings,
) -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    )
    app = QApplication([])
    app.setStyleSheet(APP_STYLES)
    app.setFont(QFont("Segoe UI", 10))

    window = SublAgentWindow(
        auth_service=auth_service,
        session_service=session_service,
        emotion_service=emotion_service,
        settings=settings,
    )
    window.show()
    app.exec()

"""Qt widgets for the agent UI."""

from PySide6.QtCore import Qt, Signal
from typing import Optional

from PySide6.QtWidgets import (
    QFrame,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QPushButton,
    QTextEdit,
    QVBoxLayout,
    QWidget,
)


class LoginView(QWidget):
    login_requested = Signal(str, str)

    def __init__(self) -> None:
        super().__init__()
        layout = QVBoxLayout(self)
        layout.setSpacing(12)

        title = QLabel("SUBL")
        title.setObjectName("Title")
        subtitle = QLabel("Stress Detection Agent")
        subtitle.setObjectName("Subtitle")

        layout.addWidget(title)
        layout.addWidget(subtitle)

        layout.addSpacing(6)

        layout.addWidget(QLabel("Email"))
        self.email_input = QLineEdit()
        self.email_input.setPlaceholderText("you@example.com")
        layout.addWidget(self.email_input)

        layout.addWidget(QLabel("Password"))
        self.password_input = QLineEdit()
        self.password_input.setEchoMode(QLineEdit.Password)
        layout.addWidget(self.password_input)

        self.status_label = QLabel("")
        self.status_label.setObjectName("Muted")
        self.status_label.setWordWrap(True)
        layout.addWidget(self.status_label)

        self.login_button = QPushButton("Sign In")
        self.login_button.setObjectName("PrimaryButton")
        self.login_button.clicked.connect(self._on_login_clicked)
        layout.addWidget(self.login_button)

        layout.addStretch(1)

        self.version_label = QLabel("")
        self.version_label.setObjectName("Muted")
        layout.addWidget(self.version_label)

    def set_status(self, message: str, is_error: bool = False) -> None:
        if is_error:
            self.status_label.setStyleSheet("color: #b91c1c;")
        else:
            self.status_label.setStyleSheet("")
        self.status_label.setText(message)

    def set_loading(self, is_loading: bool) -> None:
        self.login_button.setEnabled(not is_loading)
        self.email_input.setEnabled(not is_loading)
        self.password_input.setEnabled(not is_loading)

    def set_version(self, version: str) -> None:
        self.version_label.setText(f"Agent v{version}")

    def clear(self) -> None:
        self.password_input.clear()

    def _on_login_clicked(self) -> None:
        self.login_requested.emit(
            self.email_input.text().strip(), self.password_input.text()
        )


class DashboardView(QWidget):
    start_requested = Signal()
    pause_requested = Signal()
    stop_requested = Signal()
    analyze_requested = Signal(str)
    logout_requested = Signal()

    def __init__(self) -> None:
        super().__init__()
        layout = QVBoxLayout(self)
        layout.setSpacing(14)

        header = QLabel("SUBL Agent")
        header.setObjectName("Title")
        layout.addWidget(header)

        self.status_label = QLabel("Idle")
        self.status_label.setObjectName("Muted")
        layout.addWidget(self.status_label)

        # Current stress card
        self.stress_card = self._make_card("Current Stress")
        stress_layout = self.stress_card.layout()

        self.level_label = QLabel("-")
        self.level_label.setAlignment(Qt.AlignLeft)
        self.level_label.setStyleSheet("font-size: 22px; font-weight: 700;")
        stress_layout.addWidget(self.level_label)

        self.score_label = QLabel("No reading yet")
        self.score_label.setObjectName("Muted")
        stress_layout.addWidget(self.score_label)

        self.last_update_label = QLabel("")
        self.last_update_label.setObjectName("Muted")
        stress_layout.addWidget(self.last_update_label)

        layout.addWidget(self.stress_card)

        # Session card
        self.session_card = self._make_card("Session")
        session_layout = self.session_card.layout()

        self.session_label = QLabel("Not running")
        session_layout.addWidget(self.session_label)

        button_row = QHBoxLayout()
        self.start_button = QPushButton("Start Session")
        self.start_button.setObjectName("PrimaryButton")
        self.start_button.clicked.connect(self.start_requested.emit)
        self.pause_button = QPushButton("Pause")
        self.pause_button.setObjectName("SecondaryButton")
        self.pause_button.clicked.connect(self.pause_requested.emit)
        self.stop_button = QPushButton("End Session")
        self.stop_button.setObjectName("DangerButton")
        self.stop_button.clicked.connect(self.stop_requested.emit)

        button_row.addWidget(self.start_button)
        button_row.addWidget(self.pause_button)
        button_row.addWidget(self.stop_button)
        session_layout.addLayout(button_row)

        self.batch_label = QLabel("")
        self.batch_label.setObjectName("Muted")
        session_layout.addWidget(self.batch_label)

        layout.addWidget(self.session_card)

        # Emotion card
        self.emotion_card = self._make_card("How are you feeling? (optional)")
        emotion_layout = self.emotion_card.layout()

        hint = QLabel(
            "Type a few words and click Analyze to detect the emotion."
        )
        hint.setObjectName("Muted")
        hint.setWordWrap(True)
        emotion_layout.addWidget(hint)

        self.emotion_text = QTextEdit()
        self.emotion_text.setFixedHeight(90)
        emotion_layout.addWidget(self.emotion_text)

        analyze_row = QHBoxLayout()
        analyze_row.addStretch(1)
        self.analyze_button = QPushButton("Analyze")
        self.analyze_button.setObjectName("SecondaryButton")
        self.analyze_button.clicked.connect(self._on_analyze_clicked)
        analyze_row.addWidget(self.analyze_button)
        emotion_layout.addLayout(analyze_row)

        self.emotion_result = QLabel("")
        self.emotion_result.setWordWrap(True)
        emotion_layout.addWidget(self.emotion_result)

        layout.addWidget(self.emotion_card)

        # Footer
        footer_row = QHBoxLayout()
        footer_row.addStretch(1)
        self.logout_button = QPushButton("Sign Out")
        self.logout_button.setObjectName("SecondaryButton")
        self.logout_button.clicked.connect(self.logout_requested.emit)
        footer_row.addWidget(self.logout_button)
        layout.addLayout(footer_row)

        self.set_session_state(is_running=False, is_paused=False, session_id=None)

    def _make_card(self, title: str) -> QFrame:
        card = QFrame()
        card.setObjectName("Card")
        layout = QVBoxLayout(card)
        layout.setSpacing(8)
        label = QLabel(title)
        label.setStyleSheet("font-weight: 600;")
        layout.addWidget(label)
        return card

    def set_status(self, message: str) -> None:
        self.status_label.setText(message)

    def set_reading(
        self,
        level: str,
        score: float,
        confidence: float,
        keystrokes: int,
        last_update: str,
        color: str,
    ) -> None:
        self.level_label.setText(level)
        self.level_label.setStyleSheet(
            f"font-size: 22px; font-weight: 700; color: {color};"
        )
        self.score_label.setText(
            f"Score: {score:.2f}  |  Confidence: {confidence:.0%}  |  "
            f"Keystrokes: {keystrokes}"
        )
        self.last_update_label.setText(f"Last update: {last_update}")

    def set_session_state(
        self, is_running: bool, is_paused: bool, session_id: Optional[str]
    ) -> None:
        if is_running and session_id:
            self.session_label.setText(f"Session: {session_id[:8]}...  active")
            self.start_button.setEnabled(False)
            self.pause_button.setEnabled(True)
            self.stop_button.setEnabled(True)
            self.pause_button.setText("Resume" if is_paused else "Pause")
        else:
            self.session_label.setText("Not running")
            self.start_button.setEnabled(True)
            self.pause_button.setEnabled(False)
            self.stop_button.setEnabled(False)
            self.pause_button.setText("Pause")

    def set_batch_info(self, seconds: int) -> None:
        self.batch_label.setText(
            f"Metrics are batched every {seconds} seconds."
        )

    def set_emotion_result(self, message: str) -> None:
        self.emotion_result.setText(message)

    def _on_analyze_clicked(self) -> None:
        self.analyze_requested.emit(self.emotion_text.toPlainText().strip())

"""Shared UI styles."""

LEVEL_COLORS = {
    "Low": "#16a34a",
    "Moderate": "#f59e0b",
    "High": "#f97316",
    "Critical": "#ef4444",
}

APP_STYLES = """
QMainWindow {
    background: qlineargradient(
        x1: 0, y1: 0, x2: 1, y2: 1,
        stop: 0 #f4f7fb, stop: 1 #e9f2f7
    );
}
QWidget {
    color: #0f172a;
    font-size: 12px;
}
QLabel#Title {
    font-size: 26px;
    font-weight: 700;
    color: #0f172a;
}
QLabel#Subtitle {
    font-size: 12px;
    color: #475569;
}
QLabel#Muted {
    color: #64748b;
}
QFrame#Card {
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}
QLineEdit, QTextEdit {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 6px 8px;
}
QPushButton {
    border-radius: 8px;
    padding: 8px 14px;
}
QPushButton#PrimaryButton {
    background: #1f6feb;
    color: #ffffff;
}
QPushButton#PrimaryButton:hover {
    background: #1a5fd0;
}
QPushButton#SecondaryButton {
    background: #f1f5f9;
    color: #0f172a;
}
QPushButton#SecondaryButton:hover {
    background: #e2e8f0;
}
QPushButton#DangerButton {
    background: #ef4444;
    color: #ffffff;
}
QPushButton#DangerButton:hover {
    background: #dc2626;
}
"""

"""Application-level error types."""


class ApiError(Exception):
    """Raised when the backend returns a non-success response."""

    def __init__(self, status: int, detail: str):
        self.status = status
        self.detail = detail
        super().__init__(f"HTTP {status}: {detail}")

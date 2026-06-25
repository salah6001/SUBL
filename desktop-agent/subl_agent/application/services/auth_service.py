"""Authentication service."""

from subl_agent.application.ports import ApiGateway


class AuthService:
    def __init__(self, api: ApiGateway) -> None:
        self._api = api

    def is_authenticated(self) -> bool:
        return self._api.is_authenticated()

    def login(self, email: str, password: str) -> None:
        self._api.login(email, password)

    def logout(self) -> None:
        self._api.logout()

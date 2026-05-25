"""File-backed token store."""

import json
from pathlib import Path
from typing import Optional

from subl_agent.application.dtos import Tokens
from subl_agent.application.ports import TokenStore


class FileTokenStore(TokenStore):
    def __init__(self, token_file: Path) -> None:
        self._token_file = token_file

    def load_tokens(self) -> Optional[Tokens]:
        if not self._token_file.exists():
            return None
        try:
            data = json.loads(self._token_file.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return None
        access = data.get("accessToken")
        refresh = data.get("refreshToken")
        if not access or not refresh:
            return None
        return Tokens(access_token=access, refresh_token=refresh)

    def save_tokens(self, tokens: Tokens) -> None:
        self._token_file.write_text(
            json.dumps(
                {
                    "accessToken": tokens.access_token,
                    "refreshToken": tokens.refresh_token,
                }
            ),
            encoding="utf-8",
        )

    def clear_tokens(self) -> None:
        if self._token_file.exists():
            try:
                self._token_file.unlink()
            except OSError:
                pass

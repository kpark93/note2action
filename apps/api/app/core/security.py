"""Verifies Clerk JWTs locally against JWKS — no per-request network, no shared secret."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol

import jwt
from jwt import PyJWKClient
from jwt.exceptions import InvalidTokenError


@dataclass(frozen=True)
class VerifiedUser:
    """Identity proven by a token: who, plus the optional `name` session claim."""

    clerk_id: str
    name: str | None


class TokenVerifier(Protocol):
    """The auth boundary: token in, verified identity out."""

    def verify(self, token: str) -> VerifiedUser:
        """Verified identity; raises a PyJWTError subclass if forged/expired/malformed."""
        ...


def identity_from_claims(payload: dict[str, Any]) -> VerifiedUser:
    """Verified claims → identity; absent/empty `name` means "token doesn't say"."""
    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub:
        raise InvalidTokenError("token has no subject claim")
    name = payload.get("name")
    name = name.strip() if isinstance(name, str) else None
    return VerifiedUser(clerk_id=sub, name=name or None)


class ClerkJWKSVerifier:
    """Verifies Clerk session JWTs against the app's published JWKS."""

    def __init__(self, jwks_url: str) -> None:
        # Key set fetched on first use and cached; steady state is pure local crypto.
        self._jwks = PyJWKClient(jwks_url, cache_keys=True)

    def verify(self, token: str) -> VerifiedUser:
        """Verify signature and claims; raise PyJWTError if invalid."""
        key = self._jwks.get_signing_key_from_jwt(token)
        payload = jwt.decode(token, key.key, algorithms=["RS256"])
        return identity_from_claims(payload)

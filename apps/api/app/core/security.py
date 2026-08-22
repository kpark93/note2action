"""Verifies Clerk session JWTs locally against Clerk's JWKS keys — no
network call per request, no shared secret to leak.
Called by core/middleware.py on every request, before any route runs.
Path: browser token → core/middleware.py → [this file] → Clerk's JWKS.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol

import jwt
from jwt import PyJWKClient
from jwt.exceptions import InvalidTokenError


@dataclass(frozen=True)
class VerifiedUser:
    """Identity proven by a token: who (always) and their name (if the token
    carries the optional custom `name` session claim)."""

    clerk_id: str
    name: str | None


class TokenVerifier(Protocol):
    """The auth boundary: token in, verified identity out."""

    def verify(self, token: str) -> VerifiedUser:
        """Return the token's verified identity; raises
        jwt.exceptions.PyJWTError (subclass) if forged/expired/malformed."""
        ...


def identity_from_claims(payload: dict[str, Any]) -> VerifiedUser:
    """Pure function: verified claims → identity. `name` is an optional
    custom session claim — absent/empty means "token doesn't say"."""
    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub:
        raise InvalidTokenError("token has no subject claim")
    name = payload.get("name")
    name = name.strip() if isinstance(name, str) else None
    return VerifiedUser(clerk_id=sub, name=name or None)


class ClerkJWKSVerifier:
    """Verifies Clerk session JWTs against the app's published JWKS."""

    def __init__(self, jwks_url: str) -> None:
        # Fetches the key set on first use and caches it (with the resolved
        # signing keys), so steady-state verification is pure local crypto.
        self._jwks = PyJWKClient(jwks_url, cache_keys=True)

    def verify(self, token: str) -> VerifiedUser:
        """Verify signature and claims; raise PyJWTError if invalid."""
        key = self._jwks.get_signing_key_from_jwt(token)
        payload = jwt.decode(token, key.key, algorithms=["RS256"])
        return identity_from_claims(payload)

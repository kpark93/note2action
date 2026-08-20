"""Token verification: who is calling, proven — never trusted from the client.

Clerk gives the browser a short-lived JWT signed with Clerk's *private* key.
We verify it against Clerk's *public* keys, published as a JWKS (JSON Web Key
Set) at a well-known URL. Verifying locally means no network call to Clerk per
request — just math — and no shared secret: the public keys can't forge tokens.

Like the repository, verification sits behind a small interface so tests can
swap in a fake instead of standing up real JWKS infrastructure.
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
        """Return the token's verified identity.

        Raises jwt.exceptions.PyJWTError (or a subclass) when the token is
        forged, expired, or malformed.
        """
        ...


def identity_from_claims(payload: dict[str, Any]) -> VerifiedUser:
    """Verified claims → identity. Pure function, unit-testable without keys.

    `name` is a custom session claim (Clerk dashboard → Sessions → Customize
    session token). It lives inside the signed token, so it's as tamper-proof
    as `sub` — but it's optional: absent/empty means "token doesn't say".
    """
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
        # The token's header names which key signed it (`kid`); the client
        # looks that key up in the cached set.
        key = self._jwks.get_signing_key_from_jwt(token)
        # decode() checks the signature and the exp/nbf time claims; any
        # failure raises a PyJWTError subclass.
        payload = jwt.decode(token, key.key, algorithms=["RS256"])
        return identity_from_claims(payload)

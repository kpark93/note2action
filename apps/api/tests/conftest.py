"""Shared test setup — pytest loads this file automatically for every test."""

import pytest
from jwt.exceptions import InvalidTokenError

import app.main as main_module
from app.core.security import VerifiedUser
from app.repositories.memory import build_memory_repositories, SEED_CLERK_ID

# What test clients send to authenticate as the seeded user. With the fake
# verifier below, the bearer token simply IS the Clerk user id — legible in
# every test, no crypto involved.
AUTH = {"Authorization": f"Bearer {SEED_CLERK_ID}"}


class FakeVerifier:
    """Test twin of ClerkJWKSVerifier — same interface, no keys, no network.

    Any token that looks like a Clerk user id ("user_…") verifies as that
    user; everything else is rejected, exactly like a forged JWT. An optional
    display name rides after a pipe — "user_x|Jane Doe" — standing in for the
    real token's custom `name` session claim.
    """

    def verify(self, token: str) -> VerifiedUser:
        if not token.startswith("user_"):
            raise InvalidTokenError("not a valid test token")
        clerk_id, _, name = token.partition("|")
        return VerifiedUser(clerk_id=clerk_id, name=name or None)


@pytest.fixture(autouse=True)
def fresh_repository() -> None:
    """Give every test its own in-memory repository, regardless of .env.

    autouse: runs before each test without being asked for by name. A fresh
    fake per test means no test can poison another's data (e.g. a delete
    test shrinking the list a later test counts). The fake verifier is set
    here too, so tests never depend on CLERK_JWKS_URL.
    """
    main_module.app.state.repositories = build_memory_repositories()
    main_module.app.state.token_verifier = FakeVerifier()

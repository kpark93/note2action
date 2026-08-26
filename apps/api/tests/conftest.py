"""Shared test setup — pytest loads this file automatically for every test."""

import app.main as main_module
import pytest
from app.core.security import VerifiedUser
from app.repositories.memory import SEED_CLERK_ID, build_memory_repositories
from jwt.exceptions import InvalidTokenError

# What test clients send to authenticate as the seeded user. With the fake
# verifier below, the bearer token simply IS the Clerk user id — legible in
# every test, no crypto involved.
AUTH = {"Authorization": f"Bearer {SEED_CLERK_ID}"}


class FakeVerifier:
    """Test twin of ClerkJWKSVerifier — no keys, no network. "user_…" tokens
    verify as that user (optional name after a pipe); anything else rejects."""

    def verify(self, token: str) -> VerifiedUser:
        if not token.startswith("user_"):
            raise InvalidTokenError("not a valid test token")
        clerk_id, _, name = token.partition("|")
        return VerifiedUser(clerk_id=clerk_id, name=name or None)


@pytest.fixture(autouse=True)
def fresh_repository() -> None:
    """Fresh in-memory repos + fake verifier before every test (autouse), so no
    test can poison another's data and none depends on CLERK_JWKS_URL."""
    main_module.app.state.repositories = build_memory_repositories()
    main_module.app.state.token_verifier = FakeVerifier()

"""FastAPI application factory — wiring only: builds the repositories and token
verifier, wires auth middleware, mounts routes. Next hop: api/main.py."""

from fastapi import FastAPI

from .api.main import api_router
from .core.config import settings
from .core.middleware import require_verified_user
from .core.request_id import request_id_and_access_log
from .core.security import ClerkJWKSVerifier
from .repositories.postgres import build_postgres_repositories

app = FastAPI(title="note2action API")

# Persistence for users, meetings, and action items. Each method opens an
# RLS-scoped Postgres session; routes pull this bundle via get_repositories().
app.state.repositories = build_postgres_repositories()

# The verifier lives on app.state (not a global) so tests can swap in a fake,
# mirroring the repository seam. None = CLERK_JWKS_URL missing → loud 500s.
app.state.token_verifier = (
    ClerkJWKSVerifier(settings.clerk_jwks_url)
    if settings.clerk_jwks_url
    else None
)
app.middleware("http")(require_verified_user)
# Registered after auth = runs OUTSIDE it, so 401s also get ids + log lines.
app.middleware("http")(request_id_and_access_log)
app.include_router(api_router)

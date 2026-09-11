"""FastAPI wiring only: repositories, verifier, middleware, routes. Next: api/main.py."""

from fastapi import FastAPI

from .api.main import api_router
from .core.config import settings
from .core.middleware import require_verified_user
from .core.request_id import request_id_and_access_log
from .core.security import ClerkJWKSVerifier
from .repositories.postgres import build_postgres_repositories

app = FastAPI(title="note2action API")

# Each repo method opens an RLS-scoped session; routes pull this via get_repositories().
app.state.repositories = build_postgres_repositories()

# On app.state so tests can swap a fake; None = CLERK_JWKS_URL missing → loud 500s.
app.state.token_verifier = (
    ClerkJWKSVerifier(settings.clerk_jwks_url) if settings.clerk_jwks_url else None
)
app.middleware("http")(require_verified_user)
# Registered after auth = runs OUTSIDE it, so 401s also get ids + log lines.
app.middleware("http")(request_id_and_access_log)
app.include_router(api_router)

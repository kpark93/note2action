"""FastAPI application factory — wiring only: state, middleware, routers.

Started by the ASGI server (uvicorn app.main:app); every request enters
here first. Picks the repository and token verifier once at startup,
attaches the auth middleware, then mounts all routes.
Path: uvicorn → [this file] → core/middleware.py (verify) →
app/api/main.py (routes) → services/ → repositories/.
"""

from fastapi import FastAPI

from .api.main import api_router
from .core.config import settings
from .core.middleware import require_verified_user
from .core.security import ClerkJWKSVerifier
from .repositories.memory import build_memory_repositories
from .repositories.postgres import build_postgres_repositories

app = FastAPI(title="note2action API")

# Swap happens here and nowhere else — see app/repositories/.
app.state.repositories = (
    build_postgres_repositories()
    if settings.repository == "postgres"
    else build_memory_repositories()
)

# The verifier lives on app.state (not a global) so tests can swap in a fake,
# mirroring the repository seam. None = CLERK_JWKS_URL missing → loud 500s.
app.state.token_verifier = (
    ClerkJWKSVerifier(settings.clerk_jwks_url)
    if settings.clerk_jwks_url
    else None
)
app.middleware("http")(require_verified_user)
app.include_router(api_router)

"""Auth middleware — the central checkpoint before any endpoint runs.

Stores the verified identity on request.state for api/deps.py to read.
Path §1 [hop 7/15]: proxy (hop 6) → [this file] → security.py (verify)
→ routes (hop 8); rejection here means no route runs.
"""

from fastapi import Request
from fastapi.responses import JSONResponse
from jwt.exceptions import PyJWTError

from app.core.security import TokenVerifier

# The deliberately public surface — everything else demands a verified token.
PUBLIC_PATHS = {"/api/health", "/docs", "/openapi.json"}


async def require_verified_user(request: Request, call_next):
    """Verify the caller before any endpoint runs; the verified identity
    rides on request.state for handlers."""
    if request.url.path in PUBLIC_PATHS:
        return await call_next(request)

    # "Authorization: Bearer <token>" → ("Bearer", " ", "<token>").
    scheme, _, token = request.headers.get("Authorization", "").partition(" ")
    if scheme.lower() != "bearer" or not token:
        return JSONResponse(
            {"detail": "Not authenticated"},
            status_code=401,
            headers={"WWW-Authenticate": "Bearer"},
        )

    verifier: TokenVerifier | None = request.app.state.token_verifier
    if verifier is None:
        return JSONResponse(
            {
                "detail": "Auth is not configured — set CLERK_JWKS_URL in apps/api/.env"
            },
            status_code=500,
        )

    try:
        request.state.identity = verifier.verify(token)
    except PyJWTError:
        # Forged, expired, or malformed — 401 "who are you?", never details
        # an attacker could learn from.
        return JSONResponse(
            {"detail": "Invalid or expired token"},
            status_code=401,
            headers={"WWW-Authenticate": "Bearer"},
        )

    return await call_next(request)

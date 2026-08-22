"""Route dependencies — how handlers reach state the middleware verified.

Used by every app/api/routes/*.py handler via FastAPI's Depends();
current_user_id calls services/users.py to turn the verified identity
into a users.id.
Path §1 [hop 9/15]: route Depends() (hop 8) → [this file] →
services/users.py (identity → users.id), then back to the route, which
continues to services/items.py (hop 10).
"""

from fastapi import Request

from app.repositories.protocols import Repositories
from app.services import users as users_service


def get_repositories(request: Request) -> Repositories:
    """The active Repositories bundle (Postgres or in-memory), chosen once
    at startup in app/main.py and stashed on app.state."""
    return request.app.state.repositories


def current_user_id(request: Request) -> int:
    """The verified caller's users.id (created on first visit).

    The identity comes from request.state — stamped by the middleware from a
    *verified* token — never from anything the client typed into a body.
    """
    identity = request.state.identity
    return users_service.resolve_user_id(
        get_repositories(request).users, identity
    )

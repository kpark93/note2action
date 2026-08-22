"""Route dependencies — how handlers reach state the middleware verified.

Path §1 [hop 9/15]: route Depends() (hop 8) → [this file] →
services/users.py (identity → users.id) → back to route (hop 10).
"""

from fastapi import Request

from app.repositories.protocols import Repositories
from app.services import users as users_service


def get_repositories(request: Request) -> Repositories:
    """The active Repositories bundle (Postgres or in-memory), chosen once
    at startup in app/main.py and stashed on app.state."""
    return request.app.state.repositories


def current_user_id(request: Request) -> int:
    """Calls services/users.py resolve_user_id with the verified
    identity — never anything the client typed into a body."""
    identity = request.state.identity
    return users_service.resolve_user_id(
        get_repositories(request).users, identity
    )

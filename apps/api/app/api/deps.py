"""Route dependencies — how handlers reach state the middleware verified."""

from fastapi import Request

from app.repositories.protocols import Repositories
from app.services import users as users_service


def get_repositories(request: Request) -> Repositories:
    """The active Repositories bundle, chosen at startup and stashed on app.state."""
    return request.app.state.repositories


def current_user_id(request: Request) -> int:
    """resolve_user_id from the verified identity — never from a request body."""
    identity = request.state.identity
    return users_service.resolve_user_id(get_repositories(request).users, identity)

"""Route dependencies — how handlers reach state the middleware verified."""

from fastapi import Request

from app.repositories.protocols import Repositories
from app.services import users as users_service


def get_repositories(request: Request) -> Repositories:
    return request.app.state.repositories


def current_user_id(request: Request) -> int:
    """The verified caller's users.id (created on first visit).

    The identity comes from request.state — stamped by the middleware from a
    *verified* token — never from anything the client typed into a body.
    """
    identity = request.state.identity
    return users_service.resolve_user_id(get_repositories(request).users, identity)

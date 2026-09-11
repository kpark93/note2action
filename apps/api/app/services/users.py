"""User rules: a verified identity maps onto exactly one users row."""

from app.core.security import VerifiedUser
from app.repositories.protocols import UserRepository


def resolve_user_id(users: UserRepository, identity: VerifiedUser) -> int:
    """get_or_create_user from the verified identity — never from a request body."""
    return users.get_or_create_user(identity.clerk_id, identity.name)

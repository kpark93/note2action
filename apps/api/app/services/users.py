"""User rules: a verified identity maps onto exactly one users row."""

from app.core.security import VerifiedUser
from app.repositories.protocols import UserRepository


def resolve_user_id(users: UserRepository, identity: VerifiedUser) -> int:
    """The verified caller's users.id, created on first visit.

    Identity comes from a verified token — never from anything the client
    typed into a body. The repository owns the name laws and race handling.
    """
    return users.get_or_create_user(identity.clerk_id, identity.name)

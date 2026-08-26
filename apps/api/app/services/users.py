"""User rules: a verified identity maps onto exactly one users row.
Next hop: the UserRepository protocol → Postgres `users` (no RLS there)."""

from app.core.security import VerifiedUser
from app.repositories.protocols import UserRepository


def resolve_user_id(users: UserRepository, identity: VerifiedUser) -> int:
    """Calls UserRepository.get_or_create_user with the verified
    identity — never from anything the client typed into a body."""
    return users.get_or_create_user(identity.clerk_id, identity.name)

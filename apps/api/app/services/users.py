"""User rules: a verified identity maps onto exactly one users row.
Calls the UserRepository protocol (repositories/).
Path: api/deps.py → [this file] → UserRepository → Postgres `users`
(no RLS — the identity bootstrap table).
"""

from app.core.security import VerifiedUser
from app.repositories.protocols import UserRepository


def resolve_user_id(users: UserRepository, identity: VerifiedUser) -> int:
    """Calls UserRepository.get_or_create_user with the verified
    identity — never from anything the client typed into a body."""
    return users.get_or_create_user(identity.clerk_id, identity.name)

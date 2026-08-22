"""User rules: a verified identity maps onto exactly one users row.

Called by api/deps.py (current_user_id) on every authenticated request;
calls the UserRepository protocol (repositories/).
Path: api/deps.py → [this file] → UserRepository (repositories/) →
Postgres `users` (no RLS — it's the identity bootstrap table).
"""

from app.core.security import VerifiedUser
from app.repositories.protocols import UserRepository


def resolve_user_id(users: UserRepository, identity: VerifiedUser) -> int:
    """The verified caller's users.id, created on first visit.

    Identity comes from a verified token — never from anything the client
    typed into a body. The repository owns the name laws and race handling.
    """
    return users.get_or_create_user(identity.clerk_id, identity.name)

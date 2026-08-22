"""The common ancestor every table model inherits from.

SQLAlchemy needs one shared base class to collect every table's metadata
(used by Alembic to autogenerate migrations).
Path: models/{user,meeting,action_item}.py → [this file].
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Marker base class; carries no fields or behavior of its own."""

    pass

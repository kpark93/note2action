"""Shared declarative base; its metadata is what Alembic autogenerates from."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Marker base class; carries no fields or behavior of its own."""

    pass

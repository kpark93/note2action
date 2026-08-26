"""The common ancestor every table model inherits from — one shared base collects
all table metadata, which Alembic uses to autogenerate migrations."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Marker base class; carries no fields or behavior of its own."""

    pass

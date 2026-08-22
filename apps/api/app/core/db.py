"""The SQLAlchemy engine and session factory shared by every Postgres
repository.

Built once from settings.database_url (core/config.py); used directly
by repositories/postgres/users.py and indirectly by the rest of the
Postgres repositories via repositories/postgres/session.py.
Path: core/config.py → [this file] → repositories/postgres/*.py.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)

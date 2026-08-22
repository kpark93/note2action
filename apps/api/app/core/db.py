"""The SQLAlchemy engine and session factory for every Postgres repo.

Built once from settings.database_url (core/config.py).
Path: core/config.py → [this file] → Postgres (DATABASE_URL); used
directly by postgres/users.py, via session.py by the rest.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)

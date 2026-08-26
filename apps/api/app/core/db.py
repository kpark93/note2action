"""The SQLAlchemy engine and session factory for every Postgres repo, built once
from settings.database_url. Next hop: Postgres (DATABASE_URL)."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)

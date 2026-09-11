from logging.config import fileConfig

from alembic import context
from app.models import Base
from sqlalchemy import engine_from_config, pool

# The Alembic Config object — access to the values in alembic.ini.
config = context.config

from app.core.config import settings

# Migrations run as the admin role; the app runs as the RLS-bound role.
config.set_main_option(
    "sqlalchemy.url", settings.migrations_database_url or settings.database_url
)

# Set up Python logging from the config file.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# The models' collected metadata — what `alembic autogenerate` diffs against.
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Offline mode: configure with just a URL and emit SQL as script output."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Online mode: create an Engine and run over a live connection."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

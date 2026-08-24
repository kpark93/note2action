"""App-wide settings, loaded once from the environment / apps/api/.env.

Read by app/main.py (which repository and verifier to build) and
core/db.py (the connection string).
Path: .env / environment → [this file] → app/main.py, core/db.py.
"""

from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Every runtime knob the API reads, validated once at startup."""

    model_config = SettingsConfigDict(env_file=".env")
    # Runtime connection — after Module 13 this must be the low-privilege
    # app role (note2action_app), because superusers/table owners BYPASS RLS.
    database_url: str
    # Migrations need DDL powers the app role deliberately lacks — they run
    # as the admin role. Unset = fall back to database_url (pre-RLS setups).
    migrations_database_url: str | None = None
    # No default and no free-form strings: a typo'd REPOSITORY crashes at
    # startup instead of silently running on RAM and losing every write.
    repository: Literal["postgres", "memory"]
    # Where Clerk publishes this app's public signing keys (JWKS). Unset =
    # auth is unconfigured and every protected endpoint answers 500 loudly.
    clerk_jwks_url: str | None = None


settings = Settings()

"""App-wide settings, loaded once from the environment / apps/api/.env."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Every runtime knob the API reads, validated once at startup."""

    model_config = SettingsConfigDict(env_file=".env")
    # Runtime connection — must be the app role; superusers/table owners BYPASS RLS.
    database_url: str
    # Migrations run as the admin role (DDL powers); unset falls back to database_url.
    migrations_database_url: str | None = None
    # Clerk's JWKS URL; unset = auth unconfigured, protected endpoints 500 loudly.
    clerk_jwks_url: str | None = None


settings = Settings()

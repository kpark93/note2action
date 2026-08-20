from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")
    # Runtime connection — after Module 13 this must be the low-privilege
    # app role (note2action_app), because superusers/table owners BYPASS RLS.
    database_url: str
    # Migrations need DDL powers the app role deliberately lacks — they run
    # as the admin role. Unset = fall back to database_url (pre-RLS setups).
    migrations_database_url: str | None = None
    repository: str = "memory"
    # Where Clerk publishes this app's public signing keys (JWKS). Unset =
    # auth is unconfigured and every protected endpoint answers 500 loudly.
    clerk_jwks_url: str | None = None
settings = Settings()
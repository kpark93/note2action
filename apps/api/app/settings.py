from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")
    database_url: str
    repository: str = "memory"
    # Where Clerk publishes this app's public signing keys (JWKS). Unset =
    # auth is unconfigured and every protected endpoint answers 500 loudly.
    clerk_jwks_url: str | None = None
settings = Settings()
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./axones_acarigua.db"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    environment: str = "development"
    api_require_auth: bool = True
    jwt_secret: str = "dev-change-me"
    jwt_expire_minutes: int = 480
    cors_origins: str = "http://localhost:5174,http://127.0.0.1:5174"

    def validate_production(self) -> None:
        if self.environment.lower() != "production":
            return
        if self.jwt_secret == "dev-change-me" or len(self.jwt_secret) < 32:
            raise RuntimeError(
                "JWT_SECRET debe ser una cadena segura (≥32 caracteres) en ENVIRONMENT=production"
            )
        if self.database_url.startswith("sqlite"):
            raise RuntimeError("Use MySQL (DATABASE_URL) en ENVIRONMENT=production")


settings = Settings()
settings.validate_production()

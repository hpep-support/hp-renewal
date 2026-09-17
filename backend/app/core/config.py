from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_env: str = "development"
    secret_key: str = "change-this-secret"
    encryption_key: str = "G-d68a-wYfLwYw77QhJvD8Z1Lz2A4P7v-pWwZ3k5aR0="  # 32-byte base64 encoded for Fernet

    # Database
    database_url: str = "postgresql://dao_user:dao_pass@localhost:5432/dao_db"

    # JWT
    jwt_secret_key: str = "change-this-jwt-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    # Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    # Postiz
    postiz_api_url: str = "http://localhost:5000/api"
    postiz_api_key: str = ""

    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:3001"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Projeto
    PROJECT_NAME: str = "Sistema Operacional Inteligente"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    # API
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 horas
    ALGORITHM: str = "HS256"

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ]

    # Banco de dados
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/assistente_ia"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # IA — Groq (gratuito)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # OpenAI (opcional, caso queira usar no futuro)
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    # WhatsApp
    WHATSAPP_TOKEN: str = ""
    WHATSAPP_PHONE_ID: str = ""
    WHATSAPP_VERIFY_TOKEN: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

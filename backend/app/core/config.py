from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Projeto
    PROJECT_NAME: str = "Sistema Operacional Inteligente"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    # URLs
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    # API
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 dias
    ALGORITHM: str = "HS256"

    # Admin
    ADMIN_SECRET_KEY: str = "admin-secret-change-me"

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Banco de dados
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/assistente_ia"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # IA — Groq
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # OpenAI (opcional)
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    # Email — Resend
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "Assistente IA <noreply@assistenteia.com.br>"

    # Pagamentos — Mercado Pago
    MERCADOPAGO_ACCESS_TOKEN: str = ""
    MERCADOPAGO_PUBLIC_KEY: str = ""

    # Trial
    TRIAL_DIAS: int = 30

    # WhatsApp — Evolution API
    EVOLUTION_API_URL: str = "http://localhost:8080"
    EVOLUTION_API_KEY: str = "429683C4C977415CAAFCCE10F7D57E11"

    # WhatsApp — Meta (futuro)
    WHATSAPP_VERIFY_TOKEN: str = "orbita-webhook-token"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

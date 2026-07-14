from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings
from app.core.database import init_db, AsyncSessionLocal
from app.core.logging import RequestLoggingMiddleware, get_logger
from app.api.v1.router import api_router

logger = get_logger("main")
scheduler = AsyncIOScheduler(timezone="America/Sao_Paulo")


async def _job_alertas():
    """Job diário de alertas — roda às 8h no horário de Brasília."""
    async with AsyncSessionLocal() as db:
        try:
            from app.services.alertas_service import verificar_vencimentos
            await verificar_vencimentos(db)
        except Exception as e:
            logger.error(f"[Scheduler] Erro no job de alertas: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    logger.info("Banco inicializado")

    scheduler.add_job(
        _job_alertas,
        CronTrigger(hour=8, minute=0),
        id="alertas_vencimento",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("[Scheduler] Iniciado — alertas rodando diariamente às 8h")

    yield

    scheduler.shutdown()
    logger.info("Servidor encerrado")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Sistema Operacional Inteligente para Pequenas Empresas",
    lifespan=lifespan,
)

# ── Middlewares ────────────────────────────────────────────────────────────────

# 1. Logging estruturado com request_id
app.add_middleware(RequestLoggingMiddleware)

# 2. CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Rotas ──────────────────────────────────────────────────────────────────────

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": settings.VERSION}

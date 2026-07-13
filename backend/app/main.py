from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings
from app.core.database import init_db, AsyncSessionLocal
from app.api.v1.router import api_router

scheduler = AsyncIOScheduler(timezone="America/Sao_Paulo")


async def _job_alertas():
    """Job diário de alertas — roda às 8h no horário de Brasília."""
    async with AsyncSessionLocal() as db:
        try:
            from app.services.alertas_service import verificar_vencimentos
            await verificar_vencimentos(db)
        except Exception as e:
            print(f"[Scheduler] Erro no job de alertas: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()

    # Agendamento: todo dia às 8h
    scheduler.add_job(
        _job_alertas,
        CronTrigger(hour=8, minute=0),
        id="alertas_vencimento",
        replace_existing=True,
    )
    scheduler.start()
    print("[Scheduler] Iniciado — alertas rodando diariamente às 8h")

    yield

    scheduler.shutdown()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Sistema Operacional Inteligente para Pequenas Empresas",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": settings.VERSION}

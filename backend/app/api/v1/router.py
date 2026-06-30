from fastapi import APIRouter

from app.api.v1.endpoints import auth, chat, clientes, financeiro, estoque, whatsapp, dashboard

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Autenticação"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat IA"])
api_router.include_router(clientes.router, prefix="/clientes", tags=["Clientes"])
api_router.include_router(financeiro.router, prefix="/financeiro", tags=["Financeiro"])
api_router.include_router(estoque.router, prefix="/estoque", tags=["Estoque"])
api_router.include_router(whatsapp.router, prefix="/whatsapp", tags=["WhatsApp"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])

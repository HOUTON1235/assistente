from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_usuario
from app.schemas.chat import ChatRequest, ChatResponse
from app.ai.orchestrator import Orchestrator

router = APIRouter()


@router.post("/", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    """
    Endpoint principal do chat com o agente IA.
    Recebe uma mensagem em linguagem natural e retorna a resposta do agente.
    """
    orchestrator = Orchestrator(db=db, empresa_id=usuario.empresa_id, usuario_id=usuario.id)

    resultado = await orchestrator.processar(
        mensagem=payload.mensagem,
        conversa_id=payload.conversa_id,
        canal=payload.canal,
    )

    return ChatResponse(
        resposta=resultado["resposta"],
        conversa_id=resultado["conversa_id"],
        acao_executada=resultado.get("acao_executada"),
        dados=resultado.get("dados"),
    )


@router.get("/historico")
async def listar_conversas(
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    """Lista as conversas do usuário."""
    from sqlalchemy import select
    from app.models.conversa import Conversa

    result = await db.execute(
        select(Conversa)
        .where(Conversa.empresa_id == usuario.empresa_id)
        .order_by(Conversa.criado_em.desc())
        .limit(50)
    )
    conversas = result.scalars().all()
    return {"conversas": [{"id": c.id, "titulo": c.titulo, "canal": c.canal} for c in conversas]}

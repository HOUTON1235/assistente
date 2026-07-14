from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.deps import get_current_usuario
from app.schemas.chat import ChatRequest, ChatResponse
from app.ai.orchestrator import Orchestrator
from app.core.rate_limiter import chat_rate_limit
from app.core.logging import get_logger
from app.models.empresa import Empresa

router = APIRouter()
logger = get_logger("chat")


@router.post("/", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    request: Request,
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    """Endpoint principal do chat com o agente IA."""

    # Rate limit: 30 mensagens/minuto por empresa
    await chat_rate_limit(empresa_id=usuario.empresa_id)

    # Busca plano da empresa para controle de budget
    empresa = await db.get(Empresa, usuario.empresa_id)
    plano = empresa.plano.value if empresa else "trial"

    ip = request.client.host if request.client else None
    req_id = getattr(request.state, "request_id", None)

    orchestrator = Orchestrator(
        db=db,
        empresa_id=usuario.empresa_id,
        usuario_id=usuario.id,
        plano=plano,
    )

    resultado = await orchestrator.processar(
        mensagem=payload.mensagem,
        conversa_id=payload.conversa_id,
        canal=payload.canal,
        confirmado=getattr(payload, "confirmado", False),
        acao_pendente=getattr(payload, "acao_pendente", None),
        ip=ip,
        request_id=req_id,
    )

    logger.info(
        f"[Chat] usuario={usuario.id} empresa={usuario.empresa_id} "
        f"acao={resultado.get('acao_executada')} confirmacao={resultado.get('requer_confirmacao', False)}"
    )

    return ChatResponse(
        resposta=resultado["resposta"],
        conversa_id=resultado["conversa_id"],
        acao_executada=resultado.get("acao_executada"),
        dados=resultado.get("dados"),
        requer_confirmacao=resultado.get("requer_confirmacao", False),
        acao_pendente=resultado.get("acao_pendente"),
    )


@router.get("/historico")
async def listar_conversas(
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    from app.models.conversa import Conversa
    result = await db.execute(
        select(Conversa)
        .where(Conversa.empresa_id == usuario.empresa_id)
        .order_by(Conversa.criado_em.desc())
        .limit(50)
    )
    conversas = result.scalars().all()
    return {"conversas": [{"id": c.id, "titulo": c.titulo, "canal": c.canal} for c in conversas]}


@router.get("/conversa/{conversa_id}")
async def detalhe_conversa(
    conversa_id: str,
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    from app.models.conversa import Conversa, Mensagem

    # Garante isolamento por empresa_id
    result = await db.execute(
        select(Conversa).where(
            Conversa.id == conversa_id,
            Conversa.empresa_id == usuario.empresa_id,
        )
    )
    conversa = result.scalar_one_or_none()
    if not conversa:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")

    msgs = await db.execute(
        select(Mensagem)
        .where(Mensagem.conversa_id == conversa_id)
        .order_by(Mensagem.criado_em.asc())
        .limit(100)
    )
    mensagens = msgs.scalars().all()
    return {
        "id": conversa.id,
        "canal": conversa.canal,
        "mensagens": [
            {"id": m.id, "role": m.role.value, "conteudo": m.conteudo, "criado_em": m.criado_em.isoformat()}
            for m in mensagens
        ],
    }


@router.get("/uso-tokens")
async def uso_tokens(
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    """Retorna uso de tokens LLM do mês atual."""
    empresa = await db.get(Empresa, usuario.empresa_id)
    plano = empresa.plano.value if empresa else "trial"
    from app.ai.llm_budget import get_uso_mes
    return await get_uso_mes(empresa_id=usuario.empresa_id, plano=plano)

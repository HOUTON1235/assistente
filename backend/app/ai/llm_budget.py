"""
Controle de custo LLM — conta tokens por empresa/mês.
Bloqueia quando ultrapassa o limite configurável.
"""
import json
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import get_logger

logger = get_logger("llm_budget")

# Limite padrão por plano (tokens/mês)
LIMITES_PLANO = {
    "trial":        50_000,
    "starter":     200_000,
    "professional": 600_000,
    "business":   2_000_000,
}

DEFAULT_LIMITE = 50_000


def _redis_key(empresa_id: str) -> str:
    agora = datetime.now(timezone.utc)
    return f"tokens:{empresa_id}:{agora.year}:{agora.month}"


async def verificar_e_incrementar(
    empresa_id: str,
    plano: str,
    tokens_estimados: int = 500,
) -> dict:
    """
    Verifica se empresa ainda tem budget. Incrementa contador.
    Retorna {"ok": True} ou {"ok": False, "motivo": ...}
    """
    limite = LIMITES_PLANO.get(plano, DEFAULT_LIMITE)

    try:
        from app.core.rate_limiter import _get_redis
        r = _get_redis()
        key = _redis_key(empresa_id)
        atual = await r.incrby(key, tokens_estimados)

        # Expira no fim do mês (31 dias)
        if atual == tokens_estimados:
            await r.expire(key, 31 * 24 * 3600)

        if atual > limite:
            logger.warning(f"[Budget] empresa={empresa_id} tokens={atual}/{limite} BLOQUEADO")
            return {
                "ok": False,
                "motivo": f"Limite de tokens atingido ({atual:,}/{limite:,}). Aguarde o próximo mês ou faça upgrade.",
                "tokens_usados": atual,
                "tokens_limite": limite,
            }

        logger.info(f"[Budget] empresa={empresa_id} tokens={atual}/{limite}")
        return {"ok": True, "tokens_usados": atual, "tokens_limite": limite}

    except Exception as e:
        # Redis offline? Permite passar (fail open para não bloquear usuário)
        logger.warning(f"[Budget] Redis offline, permitindo: {e}")
        return {"ok": True}


async def get_uso_mes(empresa_id: str, plano: str) -> dict:
    """Retorna uso atual de tokens do mês."""
    limite = LIMITES_PLANO.get(plano, DEFAULT_LIMITE)
    try:
        from app.core.rate_limiter import _get_redis
        r = _get_redis()
        key = _redis_key(empresa_id)
        atual = int(await r.get(key) or 0)
        return {
            "tokens_usados": atual,
            "tokens_limite": limite,
            "percentual": round(atual / limite * 100, 1),
        }
    except Exception:
        return {"tokens_usados": 0, "tokens_limite": limite, "percentual": 0}

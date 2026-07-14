"""
Rate limiting e brute force protection usando Redis.
"""
import redis.asyncio as aioredis
from fastapi import HTTPException, Request
from app.core.config import settings

_redis: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis


async def check_rate_limit(
    key: str,
    max_requests: int,
    window_seconds: int,
    block_seconds: int = 0,
) -> None:
    """
    Lança HTTP 429 se o limite for excedido.
    Se block_seconds > 0, bloqueia a chave pelo período após atingir o limite.
    """
    r = get_redis()
    blocked_key = f"blocked:{key}"

    # Verifica se está bloqueado
    if await r.exists(blocked_key):
        ttl = await r.ttl(blocked_key)
        raise HTTPException(
            status_code=429,
            detail=f"Muitas tentativas. Tente novamente em {ttl} segundos.",
        )

    count_key = f"rl:{key}"
    count = await r.incr(count_key)

    if count == 1:
        await r.expire(count_key, window_seconds)

    if count > max_requests:
        if block_seconds > 0:
            await r.setex(blocked_key, block_seconds, "1")
            await r.delete(count_key)
        raise HTTPException(
            status_code=429,
            detail=f"Muitas tentativas. Tente novamente em {block_seconds or window_seconds} segundos.",
        )


async def login_rate_limit(email: str, ip: str) -> None:
    """20 tentativas por email em 5 min → bloqueia 5 min. (dev: limites mais altos)"""
    try:
        await check_rate_limit(
            key=f"login:email:{email}",
            max_requests=20,
            window_seconds=300,
            block_seconds=300,
        )
        await check_rate_limit(
            key=f"login:ip:{ip}",
            max_requests=100,
            window_seconds=300,
            block_seconds=60,
        )
    except HTTPException:
        raise
    except Exception:
        pass  # Redis offline? Deixa passar


async def api_rate_limit(empresa_id: str, endpoint: str, max_req: int = 200, window: int = 60) -> None:
    """Rate limit geral por empresa: 200 req/min."""
    try:
        await check_rate_limit(
            key=f"api:{empresa_id}:{endpoint}",
            max_requests=max_req,
            window_seconds=window,
        )
    except HTTPException:
        raise
    except Exception:
        pass


async def chat_rate_limit(empresa_id: str) -> None:
    """Chat: 100 mensagens por minuto por empresa."""
    try:
        await check_rate_limit(
            key=f"chat:{empresa_id}",
            max_requests=100,
            window_seconds=60,
        )
    except HTTPException:
        raise
    except Exception:
        pass


async def blacklist_token(token: str, expires_in: int) -> None:
    """Adiciona token à blacklist no Redis."""
    r = get_redis()
    await r.setex(f"blacklist:{token}", expires_in, "1")


async def is_token_blacklisted(token: str) -> bool:
    r = get_redis()
    return bool(await r.exists(f"blacklist:{token}"))

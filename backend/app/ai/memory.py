"""
Memória IA em 3 camadas:
  - Curto prazo:  Redis (últimas 10 mensagens, TTL 1h) — rápido
  - Médio prazo:  PostgreSQL (histórico completo da conversa)
  - Longo prazo:  Resumo comprimido (summary) salvo no model Conversa
"""
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.conversa import Conversa, Mensagem, CanalEnum, RoleEnum
from app.core.logging import get_logger

logger = get_logger("memory")

# Import lazy para evitar circular
def _get_redis():
    import redis.asyncio as aioredis
    from app.core.config import settings
    return aioredis.from_url(settings.REDIS_URL, decode_responses=True)


CACHE_TTL = 3600        # 1 hora no Redis
HISTORICO_CURTO = 10    # mensagens no Redis
HISTORICO_MEDIO = 30    # mensagens no DB para contexto
LIMITE_SUMMARY  = 20    # após N mensagens, comprime em summary


class ConversationMemory:
    def __init__(self, db: AsyncSession, empresa_id: str):
        self.db = db
        self.empresa_id = empresa_id

    # ── Camada 1: Redis ──────────────────────────────────────────────────────

    def _redis_key(self, conversa_id: str) -> str:
        return f"chat:hist:{conversa_id}"

    async def _cache_get(self, conversa_id: str) -> list[dict] | None:
        try:
            r = _get_redis()
            raw = await r.get(self._redis_key(conversa_id))
            if raw:
                return json.loads(raw)
        except Exception as e:
            logger.warning(f"[Memory] Redis get falhou: {e}")
        return None

    async def _cache_set(self, conversa_id: str, historico: list[dict]) -> None:
        try:
            r = _get_redis()
            await r.setex(
                self._redis_key(conversa_id),
                CACHE_TTL,
                json.dumps(historico[-HISTORICO_CURTO:]),
            )
        except Exception as e:
            logger.warning(f"[Memory] Redis set falhou: {e}")

    async def _cache_invalidar(self, conversa_id: str) -> None:
        try:
            r = _get_redis()
            await r.delete(self._redis_key(conversa_id))
        except Exception:
            pass

    # ── Camada 2: PostgreSQL ─────────────────────────────────────────────────

    async def get_or_create_conversa(
        self,
        conversa_id: str | None,
        canal: str,
        usuario_id: str | None,
    ) -> str:
        if conversa_id:
            result = await self.db.execute(
                select(Conversa).where(
                    Conversa.id == conversa_id,
                    Conversa.empresa_id == self.empresa_id,
                )
            )
            conversa = result.scalar_one_or_none()
            if conversa:
                return conversa.id

        canal_enum = CanalEnum(canal) if canal in [c.value for c in CanalEnum] else CanalEnum.web
        conversa = Conversa(
            empresa_id=self.empresa_id,
            usuario_id=usuario_id,
            canal=canal_enum,
        )
        self.db.add(conversa)
        await self.db.flush()
        logger.info(f"[Memory] Nova conversa id={conversa.id}")
        return conversa.id

    async def get_historico(self, conversa_id: str, limite: int = HISTORICO_CURTO) -> list[dict]:
        """Tenta Redis primeiro, cai no DB se não tiver."""
        cached = await self._cache_get(conversa_id)
        if cached:
            logger.info(f"[Memory] Cache hit conversa={conversa_id}")
            return cached

        # Camada 2: DB
        result = await self.db.execute(
            select(Mensagem)
            .where(Mensagem.conversa_id == conversa_id)
            .order_by(Mensagem.criado_em.desc())
            .limit(HISTORICO_MEDIO)
        )
        mensagens = result.scalars().all()
        historico = [
            {"role": m.role.value, "content": m.conteudo}
            for m in reversed(mensagens)
        ]

        # Camada 3: prepend summary se existir
        conversa = await self.db.get(Conversa, conversa_id)
        if conversa and getattr(conversa, "summary", None):
            historico = [{"role": "system", "content": f"[Resumo anterior]: {conversa.summary}"}] + historico

        # Repopula cache
        await self._cache_set(conversa_id, historico)
        return historico

    async def salvar_mensagem(self, conversa_id: str, role: str, conteudo: str) -> None:
        role_enum = RoleEnum(role) if role in [r.value for r in RoleEnum] else RoleEnum.user
        mensagem = Mensagem(
            conversa_id=conversa_id,
            role=role_enum,
            conteudo=conteudo,
        )
        self.db.add(mensagem)
        await self.db.flush()

        # Invalida cache para forçar rebuild na próxima leitura
        await self._cache_invalidar(conversa_id)

        # Verifica se precisa comprimir (camada 3)
        await self._comprimir_se_necessario(conversa_id)

    # ── Camada 3: Summary ────────────────────────────────────────────────────

    async def _comprimir_se_necessario(self, conversa_id: str) -> None:
        """
        Após LIMITE_SUMMARY mensagens, gera um resumo comprimido e
        arquiva as mensagens antigas para manter o contexto enxuto.
        """
        result = await self.db.execute(
            select(Mensagem)
            .where(Mensagem.conversa_id == conversa_id)
            .order_by(Mensagem.criado_em.asc())
        )
        mensagens = result.scalars().all()

        if len(mensagens) < LIMITE_SUMMARY:
            return

        # Gera summary das primeiras mensagens (deixa as últimas 5 intactas)
        a_comprimir = mensagens[:-5]
        if not a_comprimir:
            return

        texto = "\n".join(
            f"{m.role.value}: {m.conteudo[:200]}" for m in a_comprimir
        )
        summary = f"Conversa anterior ({len(a_comprimir)} mensagens): {texto[:800]}"

        conversa = await self.db.get(Conversa, conversa_id)
        if conversa:
            # Só atualiza se Conversa tiver coluna summary (adicionamos abaixo)
            if hasattr(conversa, "summary"):
                conversa.summary = summary
                await self.db.flush()

        logger.info(f"[Memory] Summary gerado conversa={conversa_id} msgs_comprimidas={len(a_comprimir)}")

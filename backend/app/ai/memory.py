"""
Gerenciamento de memória das conversas.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.models.conversa import Conversa, Mensagem, CanalEnum, RoleEnum


class ConversationMemory:
    def __init__(self, db: AsyncSession, empresa_id: str):
        self.db = db
        self.empresa_id = empresa_id

    async def get_or_create_conversa(
        self,
        conversa_id: str | None,
        canal: str,
        usuario_id: str | None,
    ) -> str:
        """Recupera uma conversa existente ou cria uma nova."""
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

        # Criar nova conversa
        canal_enum = CanalEnum(canal) if canal in [c.value for c in CanalEnum] else CanalEnum.web
        conversa = Conversa(
            empresa_id=self.empresa_id,
            usuario_id=usuario_id,
            canal=canal_enum,
        )
        self.db.add(conversa)
        await self.db.flush()
        return conversa.id

    async def get_historico(self, conversa_id: str, limite: int = 10) -> list[dict]:
        """Retorna o histórico recente da conversa."""
        result = await self.db.execute(
            select(Mensagem)
            .where(Mensagem.conversa_id == conversa_id)
            .order_by(Mensagem.criado_em.desc())
            .limit(limite)
        )
        mensagens = result.scalars().all()
        return [
            {"role": m.role.value, "content": m.conteudo}
            for m in reversed(mensagens)
        ]

    async def salvar_mensagem(self, conversa_id: str, role: str, conteudo: str) -> None:
        """Salva uma mensagem no histórico."""
        role_enum = RoleEnum(role) if role in [r.value for r in RoleEnum] else RoleEnum.user
        mensagem = Mensagem(
            conversa_id=conversa_id,
            role=role_enum,
            conteudo=conteudo,
        )
        self.db.add(mensagem)
        await self.db.flush()

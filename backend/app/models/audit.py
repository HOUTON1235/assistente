"""
Modelo de auditoria — registra todas as ações write no sistema.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    empresa_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    usuario_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    acao: Mapped[str] = mapped_column(String(100))          # "create_transacao", "delete_cliente"
    recurso: Mapped[str] = mapped_column(String(100))       # "transacao", "cliente"
    recurso_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    dados_antes: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    dados_depois: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    request_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

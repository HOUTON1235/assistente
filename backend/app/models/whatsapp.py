"""Modelo para instâncias WhatsApp vinculadas a empresas."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Boolean, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from app.core.database import Base


class WhatsappInstancia(Base):
    __tablename__ = "whatsapp_instancias"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    empresa_id: Mapped[str] = mapped_column(String(36), index=True)
    nome_instancia: Mapped[str] = mapped_column(String(100))
    numero: Mapped[str | None] = mapped_column(String(20), nullable=True)
    conectado: Mapped[bool] = mapped_column(Boolean, default=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)

    # Configurações de atendimento
    ativo_atendimento: Mapped[bool] = mapped_column(Boolean, default=True)
    responder_grupos: Mapped[bool] = mapped_column(Boolean, default=False)
    mensagem_boas_vindas: Mapped[str | None] = mapped_column(Text, nullable=True,
        default="Olá! Sou a Orbita, assistente da empresa. Como posso ajudar?")
    mensagem_fora_horario: Mapped[str | None] = mapped_column(Text, nullable=True,
        default="No momento estamos fora do horário de atendimento. Retornaremos em breve!")
    horario_inicio: Mapped[str | None] = mapped_column(String(5), nullable=True, default="08:00")
    horario_fim: Mapped[str | None] = mapped_column(String(5), nullable=True, default="18:00")
    dias_atendimento: Mapped[list | None] = mapped_column(JSON, nullable=True,
        default=lambda: [1, 2, 3, 4, 5])  # 0=dom, 1=seg...6=sab
    prompt_personalizado: Mapped[str | None] = mapped_column(Text, nullable=True)

    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc))

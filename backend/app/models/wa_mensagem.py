"""Mensagens WhatsApp — recebidas e enviadas."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class WaMensagem(Base):
    __tablename__ = "wa_mensagens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    empresa_id: Mapped[str] = mapped_column(String(36), index=True)

    # Identificação da conversa
    numero: Mapped[str] = mapped_column(String(30), index=True)   # número do contato (sem @s.whatsapp.net)
    nome_contato: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Mensagem
    mensagem_id: Mapped[str | None] = mapped_column(String(100), nullable=True, unique=True)
    texto: Mapped[str] = mapped_column(Text)
    direcao: Mapped[str] = mapped_column(String(10))   # "recebida" | "enviada"
    lida: Mapped[bool] = mapped_column(Boolean, default=False)

    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

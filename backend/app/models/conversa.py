from sqlalchemy import String, DateTime, ForeignKey, Text, Enum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import enum
import uuid

from app.core.database import Base


class CanalEnum(str, enum.Enum):
    web = "web"
    whatsapp = "whatsapp"
    api = "api"


class RoleEnum(str, enum.Enum):
    user = "user"
    assistant = "assistant"
    system = "system"


class Conversa(Base):
    __tablename__ = "conversas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    empresa_id: Mapped[str] = mapped_column(ForeignKey("empresas.id"), nullable=False)
    usuario_id: Mapped[str | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    canal: Mapped[CanalEnum] = mapped_column(Enum(CanalEnum), default=CanalEnum.web)
    titulo: Mapped[str | None] = mapped_column(String(255), nullable=True)
    criado_em: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    mensagens: Mapped[list["Mensagem"]] = relationship("Mensagem", back_populates="conversa", order_by="Mensagem.criado_em")

    def __repr__(self):
        return f"<Conversa {self.id} canal={self.canal}>"


class Mensagem(Base):
    __tablename__ = "mensagens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversa_id: Mapped[str] = mapped_column(ForeignKey("conversas.id"), nullable=False)
    role: Mapped[RoleEnum] = mapped_column(Enum(RoleEnum), nullable=False)
    conteudo: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    tokens_usados: Mapped[int | None] = mapped_column(nullable=True)
    criado_em: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    conversa: Mapped["Conversa"] = relationship("Conversa", back_populates="mensagens")

    def __repr__(self):
        return f"<Mensagem {self.role} {self.criado_em}>"

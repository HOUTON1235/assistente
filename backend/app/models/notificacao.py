from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import enum
import uuid

from app.core.database import Base


class TipoNotificacaoEnum(str, enum.Enum):
    vencimento = "vencimento"
    estoque_baixo = "estoque_baixo"
    trial = "trial"
    pagamento = "pagamento"
    sistema = "sistema"


class Notificacao(Base):
    __tablename__ = "notificacoes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    empresa_id: Mapped[str] = mapped_column(ForeignKey("empresas.id"), nullable=False)
    tipo: Mapped[TipoNotificacaoEnum] = mapped_column(Enum(TipoNotificacaoEnum), default=TipoNotificacaoEnum.sistema)
    titulo: Mapped[str] = mapped_column(String(255), nullable=False)
    mensagem: Mapped[str] = mapped_column(Text, nullable=False)
    lida: Mapped[bool] = mapped_column(Boolean, default=False)
    link: Mapped[str | None] = mapped_column(String(255), nullable=True)
    criado_em: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Notificacao {self.tipo} {self.titulo}>"

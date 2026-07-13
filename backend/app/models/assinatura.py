from sqlalchemy import String, DateTime, ForeignKey, Enum, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import enum
import uuid

from app.core.database import Base


class StatusAssinaturaEnum(str, enum.Enum):
    trial = "trial"
    ativa = "ativa"
    cancelada = "cancelada"
    suspensa = "suspensa"
    expirada = "expirada"


class Assinatura(Base):
    __tablename__ = "assinaturas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    empresa_id: Mapped[str] = mapped_column(ForeignKey("empresas.id"), nullable=False)
    plano: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[StatusAssinaturaEnum] = mapped_column(Enum(StatusAssinaturaEnum), default=StatusAssinaturaEnum.trial)
    valor: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)

    # Mercado Pago
    mp_payment_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    mp_subscription_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    mp_preference_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    inicio_em: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expira_em: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelado_em: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    empresa: Mapped["Empresa"] = relationship("Empresa", back_populates="assinaturas")

    def __repr__(self):
        return f"<Assinatura {self.plano} {self.status}>"

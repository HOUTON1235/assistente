from sqlalchemy import String, Boolean, DateTime, Enum, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import enum
import uuid
from datetime import datetime, timezone, timedelta

from app.core.database import Base


class PlanoEnum(str, enum.Enum):
    trial = "trial"
    starter = "starter"
    professional = "professional"
    business = "business"
    enterprise = "enterprise"


class StatusEmpresaEnum(str, enum.Enum):
    ativa = "ativa"
    trial = "trial"
    suspensa = "suspensa"
    cancelada = "cancelada"


class Empresa(Base):
    __tablename__ = "empresas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    cnpj: Mapped[str | None] = mapped_column(String(18), unique=True, nullable=True)
    cpf: Mapped[str | None] = mapped_column(String(14), nullable=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    telefone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Endereço
    cep: Mapped[str | None] = mapped_column(String(9), nullable=True)
    logradouro: Mapped[str | None] = mapped_column(String(255), nullable=True)
    numero: Mapped[str | None] = mapped_column(String(20), nullable=True)
    complemento: Mapped[str | None] = mapped_column(String(100), nullable=True)
    bairro: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cidade: Mapped[str | None] = mapped_column(String(100), nullable=True)
    estado: Mapped[str | None] = mapped_column(String(2), nullable=True)
    latitude: Mapped[str | None] = mapped_column(String(20), nullable=True)
    longitude: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Plano e status
    plano: Mapped[PlanoEnum] = mapped_column(Enum(PlanoEnum), default=PlanoEnum.trial)
    status: Mapped[StatusEmpresaEnum] = mapped_column(Enum(StatusEmpresaEnum), default=StatusEmpresaEnum.trial)
    trial_expira_em: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Pagamento
    mp_customer_id: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Mercado Pago
    mp_subscription_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Limites do plano
    max_usuarios: Mapped[int] = mapped_column(Integer, default=1)
    max_transacoes_mes: Mapped[int] = mapped_column(Integer, default=500)

    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    configuracoes: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    # Relacionamentos
    usuarios: Mapped[list["Usuario"]] = relationship("Usuario", back_populates="empresa")
    clientes: Mapped[list["Cliente"]] = relationship("Cliente", back_populates="empresa")
    financeiro: Mapped[list["Transacao"]] = relationship("Transacao", back_populates="empresa")
    estoque: Mapped[list["Produto"]] = relationship("Produto", back_populates="empresa")
    assinaturas: Mapped[list["Assinatura"]] = relationship("Assinatura", back_populates="empresa")

    @property
    def trial_ativo(self) -> bool:
        if self.plano != PlanoEnum.trial:
            return False
        if not self.trial_expira_em:
            return False
        return datetime.now(timezone.utc) < self.trial_expira_em

    @property
    def trial_dias_restantes(self) -> int:
        if not self.trial_expira_em:
            return 0
        delta = self.trial_expira_em - datetime.now(timezone.utc)
        return max(0, delta.days)

    def __repr__(self):
        return f"<Empresa {self.nome}>"

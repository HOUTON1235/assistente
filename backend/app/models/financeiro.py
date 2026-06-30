from sqlalchemy import String, DateTime, ForeignKey, Text, Numeric, Enum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import enum
import uuid

from app.core.database import Base


class TipoTransacaoEnum(str, enum.Enum):
    receita = "receita"
    despesa = "despesa"


class StatusTransacaoEnum(str, enum.Enum):
    pendente = "pendente"
    pago = "pago"
    vencido = "vencido"
    cancelado = "cancelado"


class CategoriaEnum(str, enum.Enum):
    vendas = "vendas"
    servicos = "servicos"
    aluguel = "aluguel"
    salarios = "salarios"
    fornecedores = "fornecedores"
    impostos = "impostos"
    outros = "outros"


class Transacao(Base):
    __tablename__ = "transacoes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    empresa_id: Mapped[str] = mapped_column(ForeignKey("empresas.id"), nullable=False)
    cliente_id: Mapped[str | None] = mapped_column(ForeignKey("clientes.id"), nullable=True)
    tipo: Mapped[TipoTransacaoEnum] = mapped_column(Enum(TipoTransacaoEnum), nullable=False)
    categoria: Mapped[CategoriaEnum] = mapped_column(Enum(CategoriaEnum), default=CategoriaEnum.outros)
    descricao: Mapped[str] = mapped_column(Text, nullable=False)
    valor: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[StatusTransacaoEnum] = mapped_column(Enum(StatusTransacaoEnum), default=StatusTransacaoEnum.pendente)
    data_vencimento: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    data_pagamento: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    recorrente: Mapped[bool] = mapped_column(Boolean, default=False)
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    empresa: Mapped["Empresa"] = relationship("Empresa", back_populates="financeiro")
    cliente: Mapped["Cliente | None"] = relationship("Cliente", back_populates="transacoes")

    def __repr__(self):
        return f"<Transacao {self.tipo} R${self.valor}>"

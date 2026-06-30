from sqlalchemy import String, Boolean, DateTime, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import enum
import uuid

from app.core.database import Base


class PlanoEnum(str, enum.Enum):
    starter = "starter"
    professional = "professional"
    business = "business"
    enterprise = "enterprise"


class Empresa(Base):
    __tablename__ = "empresas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    cnpj: Mapped[str | None] = mapped_column(String(18), unique=True, nullable=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    telefone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    plano: Mapped[PlanoEnum] = mapped_column(Enum(PlanoEnum), default=PlanoEnum.starter)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    configuracoes: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON
    criado_em: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    # Relacionamentos
    usuarios: Mapped[list["Usuario"]] = relationship("Usuario", back_populates="empresa")
    clientes: Mapped[list["Cliente"]] = relationship("Cliente", back_populates="empresa")
    financeiro: Mapped[list["Transacao"]] = relationship("Transacao", back_populates="empresa")
    estoque: Mapped[list["Produto"]] = relationship("Produto", back_populates="empresa")

    def __repr__(self):
        return f"<Empresa {self.nome}>"

from sqlalchemy import String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import enum
import uuid

from app.core.database import Base


class PerfilEnum(str, enum.Enum):
    admin = "admin"
    gestor = "gestor"
    operador = "operador"
    contador = "contador"


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    empresa_id: Mapped[str] = mapped_column(ForeignKey("empresas.id"), nullable=False)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    perfil: Mapped[PerfilEnum] = mapped_column(Enum(PerfilEnum), default=PerfilEnum.operador)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    ultimo_acesso: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    criado_em: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    empresa: Mapped["Empresa"] = relationship("Empresa", back_populates="usuarios")

    def __repr__(self):
        return f"<Usuario {self.email}>"

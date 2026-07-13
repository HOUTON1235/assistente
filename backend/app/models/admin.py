from sqlalchemy import String, Boolean, DateTime, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
import enum
import uuid

from app.core.database import Base


class PerfilAdminEnum(str, enum.Enum):
    superadmin = "superadmin"
    suporte = "suporte"
    financeiro = "financeiro"


class Admin(Base):
    __tablename__ = "admins"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    perfil: Mapped[PerfilAdminEnum] = mapped_column(Enum(PerfilAdminEnum), default=PerfilAdminEnum.suporte)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    ultimo_acesso: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    criado_em: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Admin {self.email}>"

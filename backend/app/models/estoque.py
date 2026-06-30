from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, Numeric, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class Produto(Base):
    __tablename__ = "produtos"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    empresa_id: Mapped[str] = mapped_column(ForeignKey("empresas.id"), nullable=False)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    sku: Mapped[str | None] = mapped_column(String(100), nullable=True)
    codigo_barras: Mapped[str | None] = mapped_column(String(50), nullable=True)
    preco_custo: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    preco_venda: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    quantidade: Mapped[int] = mapped_column(Integer, default=0)
    quantidade_minima: Mapped[int] = mapped_column(Integer, default=5)
    unidade: Mapped[str] = mapped_column(String(20), default="un")
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    criado_em: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    # Relacionamentos
    empresa: Mapped["Empresa"] = relationship("Empresa", back_populates="estoque")
    movimentacoes: Mapped[list["MovimentacaoEstoque"]] = relationship("MovimentacaoEstoque", back_populates="produto")

    @property
    def estoque_baixo(self) -> bool:
        return self.quantidade <= self.quantidade_minima

    def __repr__(self):
        return f"<Produto {self.nome} qtd={self.quantidade}>"


class MovimentacaoEstoque(Base):
    __tablename__ = "movimentacoes_estoque"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    produto_id: Mapped[str] = mapped_column(ForeignKey("produtos.id"), nullable=False)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)  # entrada / saida / ajuste
    quantidade: Mapped[int] = mapped_column(Integer, nullable=False)
    motivo: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    produto: Mapped["Produto"] = relationship("Produto", back_populates="movimentacoes")

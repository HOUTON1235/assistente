from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.api.deps import get_current_usuario
from app.models.estoque import Produto, MovimentacaoEstoque

router = APIRouter()


class ProdutoCreate(BaseModel):
    nome: str
    descricao: Optional[str] = None
    sku: Optional[str] = None
    preco_custo: Optional[float] = None
    preco_venda: float
    quantidade: int = 0
    quantidade_minima: int = 5
    unidade: str = "un"


class MovimentacaoCreate(BaseModel):
    tipo: str  # entrada | saida | ajuste
    quantidade: int
    motivo: Optional[str] = None


class ProdutoSchema(BaseModel):
    id: str
    nome: str
    preco_venda: float
    quantidade: int
    quantidade_minima: int
    unidade: str
    ativo: bool

    class Config:
        from_attributes = True


@router.get("/", response_model=list[ProdutoSchema])
async def listar_produtos(
    estoque_baixo: bool = Query(False),
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    query = select(Produto).where(
        Produto.empresa_id == usuario.empresa_id,
        Produto.ativo == True,
    )
    result = await db.execute(query)
    produtos = result.scalars().all()

    if estoque_baixo:
        produtos = [p for p in produtos if p.estoque_baixo]

    return produtos


@router.post("/", response_model=ProdutoSchema, status_code=201)
async def criar_produto(
    payload: ProdutoCreate,
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    produto = Produto(empresa_id=usuario.empresa_id, **payload.model_dump())
    db.add(produto)
    await db.flush()
    await db.refresh(produto)
    return produto


@router.post("/{produto_id}/movimentar")
async def movimentar_estoque(
    produto_id: str,
    payload: MovimentacaoCreate,
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Produto).where(
            Produto.id == produto_id,
            Produto.empresa_id == usuario.empresa_id,
        )
    )
    produto = result.scalar_one_or_none()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    if payload.tipo == "entrada":
        produto.quantidade += payload.quantidade
    elif payload.tipo == "saida":
        if produto.quantidade < payload.quantidade:
            raise HTTPException(status_code=400, detail="Estoque insuficiente")
        produto.quantidade -= payload.quantidade
    elif payload.tipo == "ajuste":
        produto.quantidade = payload.quantidade

    mov = MovimentacaoEstoque(
        produto_id=produto_id,
        tipo=payload.tipo,
        quantidade=payload.quantidade,
        motivo=payload.motivo,
    )
    db.add(mov)
    await db.flush()

    return {"mensagem": "Movimentação registrada", "quantidade_atual": produto.quantidade}

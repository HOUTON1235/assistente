from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.api.deps import get_current_usuario
from app.models.cliente import Cliente

router = APIRouter()


class ClienteCreate(BaseModel):
    nome: str
    email: Optional[str] = None
    telefone: Optional[str] = None
    cpf_cnpj: Optional[str] = None
    endereco: Optional[str] = None
    observacoes: Optional[str] = None
    limite_credito: Optional[float] = None


class ClienteSchema(BaseModel):
    id: str
    nome: str
    email: Optional[str]
    telefone: Optional[str]
    cpf_cnpj: Optional[str]
    ativo: bool

    class Config:
        from_attributes = True


@router.get("/", response_model=list[ClienteSchema])
async def listar_clientes(
    busca: Optional[str] = Query(None),
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    query = select(Cliente).where(
        Cliente.empresa_id == usuario.empresa_id,
        Cliente.ativo == True,
    )
    if busca:
        query = query.where(
            Cliente.nome.ilike(f"%{busca}%") | Cliente.email.ilike(f"%{busca}%")
        )
    query = query.order_by(Cliente.nome).limit(100)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=ClienteSchema, status_code=201)
async def criar_cliente(
    payload: ClienteCreate,
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    cliente = Cliente(empresa_id=usuario.empresa_id, **payload.model_dump())
    db.add(cliente)
    await db.flush()
    await db.refresh(cliente)
    return cliente


@router.get("/{cliente_id}", response_model=ClienteSchema)
async def obter_cliente(
    cliente_id: str,
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Cliente).where(
            Cliente.id == cliente_id,
            Cliente.empresa_id == usuario.empresa_id,
        )
    )
    cliente = result.scalar_one_or_none()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return cliente


@router.delete("/{cliente_id}", status_code=204)
async def desativar_cliente(
    cliente_id: str,
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Cliente).where(
            Cliente.id == cliente_id,
            Cliente.empresa_id == usuario.empresa_id,
        )
    )
    cliente = result.scalar_one_or_none()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    cliente.ativo = False

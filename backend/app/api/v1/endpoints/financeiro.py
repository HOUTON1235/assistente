from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.core.database import get_db
from app.api.deps import get_current_usuario
from app.models.financeiro import Transacao, TipoTransacaoEnum, StatusTransacaoEnum
from app.schemas.financeiro import TransacaoCreate, TransacaoUpdate, TransacaoSchema, ResumoFinanceiro

router = APIRouter()


@router.get("/resumo", response_model=ResumoFinanceiro)
async def resumo_financeiro(
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    """Retorna resumo financeiro da empresa."""
    empresa_id = usuario.empresa_id

    receitas = await db.execute(
        select(func.sum(Transacao.valor)).where(
            Transacao.empresa_id == empresa_id,
            Transacao.tipo == TipoTransacaoEnum.receita,
            Transacao.status == StatusTransacaoEnum.pago,
        )
    )
    despesas = await db.execute(
        select(func.sum(Transacao.valor)).where(
            Transacao.empresa_id == empresa_id,
            Transacao.tipo == TipoTransacaoEnum.despesa,
            Transacao.status == StatusTransacaoEnum.pago,
        )
    )
    vencidas = await db.execute(
        select(func.count()).where(
            Transacao.empresa_id == empresa_id,
            Transacao.status == StatusTransacaoEnum.vencido,
        )
    )

    from datetime import datetime, timezone, timedelta
    agora = datetime.now(timezone.utc)
    a_vencer = await db.execute(
        select(func.count()).where(
            Transacao.empresa_id == empresa_id,
            Transacao.status == StatusTransacaoEnum.pendente,
            Transacao.data_vencimento != None,
            Transacao.data_vencimento <= agora + timedelta(days=7),
            Transacao.data_vencimento >= agora,
        )
    )

    total_receitas = receitas.scalar() or 0.0
    total_despesas = despesas.scalar() or 0.0

    return ResumoFinanceiro(
        total_receitas=float(total_receitas),
        total_despesas=float(total_despesas),
        saldo=float(total_receitas - total_despesas),
        contas_vencidas=vencidas.scalar() or 0,
        contas_a_vencer=a_vencer.scalar() or 0,
    )


@router.get("/", response_model=list[TransacaoSchema])
async def listar_transacoes(
    tipo: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    query = select(Transacao).where(Transacao.empresa_id == usuario.empresa_id)
    if tipo:
        query = query.where(Transacao.tipo == tipo)
    if status:
        query = query.where(Transacao.status == status)
    query = query.order_by(Transacao.criado_em.desc()).limit(100)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=TransacaoSchema, status_code=201)
async def criar_transacao(
    payload: TransacaoCreate,
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    transacao = Transacao(empresa_id=usuario.empresa_id, **payload.model_dump())
    db.add(transacao)
    await db.flush()
    await db.refresh(transacao)
    return transacao


@router.patch("/{transacao_id}", response_model=TransacaoSchema)
async def atualizar_transacao(
    transacao_id: str,
    payload: TransacaoUpdate,
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transacao).where(
            Transacao.id == transacao_id,
            Transacao.empresa_id == usuario.empresa_id,
        )
    )
    transacao = result.scalar_one_or_none()
    if not transacao:
        raise HTTPException(status_code=404, detail="Transação não encontrada")

    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(transacao, campo, valor)

    await db.flush()
    await db.refresh(transacao)
    return transacao

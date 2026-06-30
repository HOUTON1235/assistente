from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.api.deps import get_current_usuario
from app.models.financeiro import Transacao, TipoTransacaoEnum, StatusTransacaoEnum
from app.models.cliente import Cliente
from app.models.estoque import Produto

router = APIRouter()


@router.get("/")
async def dashboard(
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    """Retorna todos os dados necessários para o dashboard principal."""
    empresa_id = usuario.empresa_id

    # Contadores básicos
    total_clientes = await db.execute(
        select(func.count()).where(Cliente.empresa_id == empresa_id, Cliente.ativo == True)
    )

    total_produtos = await db.execute(
        select(func.count()).where(Produto.empresa_id == empresa_id, Produto.ativo == True)
    )

    # Financeiro
    receitas_mes = await db.execute(
        select(func.sum(Transacao.valor)).where(
            Transacao.empresa_id == empresa_id,
            Transacao.tipo == TipoTransacaoEnum.receita,
            Transacao.status == StatusTransacaoEnum.pago,
        )
    )

    despesas_mes = await db.execute(
        select(func.sum(Transacao.valor)).where(
            Transacao.empresa_id == empresa_id,
            Transacao.tipo == TipoTransacaoEnum.despesa,
            Transacao.status == StatusTransacaoEnum.pago,
        )
    )

    contas_vencidas = await db.execute(
        select(func.count()).where(
            Transacao.empresa_id == empresa_id,
            Transacao.status == StatusTransacaoEnum.vencido,
        )
    )

    # Produtos com estoque baixo
    produtos_estoque_baixo = await db.execute(
        select(func.count()).where(
            Produto.empresa_id == empresa_id,
            Produto.ativo == True,
            Produto.quantidade <= Produto.quantidade_minima,
        )
    )

    total_r = float(receitas_mes.scalar() or 0)
    total_d = float(despesas_mes.scalar() or 0)

    return {
        "clientes": total_clientes.scalar(),
        "produtos": total_produtos.scalar(),
        "financeiro": {
            "receitas": total_r,
            "despesas": total_d,
            "saldo": total_r - total_d,
        },
        "alertas": {
            "contas_vencidas": contas_vencidas.scalar(),
            "estoque_baixo": produtos_estoque_baixo.scalar(),
        },
    }

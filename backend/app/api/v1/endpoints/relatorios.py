from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from typing import Optional
from datetime import datetime, timezone

from app.core.database import get_db
from app.api.deps import get_current_usuario
from app.models.financeiro import Transacao, TipoTransacaoEnum, StatusTransacaoEnum, CategoriaEnum

router = APIRouter()


@router.get("/dre")
async def dre(
    mes: int = Query(default=None),
    ano: int = Query(default=None),
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    """
    DRE simplificado — Demonstrativo de Resultado do Exercício.
    Filtra por mês/ano ou retorna o mês atual se não informado.
    """
    agora = datetime.now(timezone.utc)
    mes = mes or agora.month
    ano = ano or agora.year
    empresa_id = usuario.empresa_id

    def filtro_base(tipo, status=None):
        q = select(func.sum(Transacao.valor), func.count(Transacao.id)).where(
            Transacao.empresa_id == empresa_id,
            Transacao.tipo == tipo,
            extract("month", Transacao.criado_em) == mes,
            extract("year", Transacao.criado_em) == ano,
        )
        if status:
            q = q.where(Transacao.status == status)
        return q

    # Receitas pagas
    rec_pagas = await db.execute(filtro_base(TipoTransacaoEnum.receita, StatusTransacaoEnum.pago))
    rec_pendentes = await db.execute(filtro_base(TipoTransacaoEnum.receita, StatusTransacaoEnum.pendente))

    # Despesas pagas
    desp_pagas = await db.execute(filtro_base(TipoTransacaoEnum.despesa, StatusTransacaoEnum.pago))
    desp_pendentes = await db.execute(filtro_base(TipoTransacaoEnum.despesa, StatusTransacaoEnum.pendente))

    # Por categoria
    cat_result = await db.execute(
        select(Transacao.categoria, Transacao.tipo, func.sum(Transacao.valor))
        .where(
            Transacao.empresa_id == empresa_id,
            Transacao.status == StatusTransacaoEnum.pago,
            extract("month", Transacao.criado_em) == mes,
            extract("year", Transacao.criado_em) == ano,
        )
        .group_by(Transacao.categoria, Transacao.tipo)
    )

    rp = rec_pagas.one()
    rpend = rec_pendentes.one()
    dp = desp_pagas.one()
    dpend = desp_pendentes.one()

    total_receitas = float(rp[0] or 0)
    total_despesas = float(dp[0] or 0)
    lucro = total_receitas - total_despesas
    margem = round((lucro / total_receitas * 100), 1) if total_receitas > 0 else 0

    # Agrupa categorias
    por_categoria = {}
    for categoria, tipo, valor in cat_result.all():
        key = categoria.value if hasattr(categoria, "value") else str(categoria)
        if key not in por_categoria:
            por_categoria[key] = {"receitas": 0, "despesas": 0}
        if tipo == TipoTransacaoEnum.receita:
            por_categoria[key]["receitas"] += float(valor or 0)
        else:
            por_categoria[key]["despesas"] += float(valor or 0)

    # Últimos 6 meses para o gráfico
    historico = []
    for m in range(5, -1, -1):
        m_ref = mes - m
        a_ref = ano
        while m_ref <= 0:
            m_ref += 12
            a_ref -= 1

        r = await db.execute(
            select(func.sum(Transacao.valor)).where(
                Transacao.empresa_id == empresa_id,
                Transacao.tipo == TipoTransacaoEnum.receita,
                Transacao.status == StatusTransacaoEnum.pago,
                extract("month", Transacao.criado_em) == m_ref,
                extract("year", Transacao.criado_em) == a_ref,
            )
        )
        d = await db.execute(
            select(func.sum(Transacao.valor)).where(
                Transacao.empresa_id == empresa_id,
                Transacao.tipo == TipoTransacaoEnum.despesa,
                Transacao.status == StatusTransacaoEnum.pago,
                extract("month", Transacao.criado_em) == m_ref,
                extract("year", Transacao.criado_em) == a_ref,
            )
        )
        historico.append({
            "mes": m_ref,
            "ano": a_ref,
            "receitas": float(r.scalar() or 0),
            "despesas": float(d.scalar() or 0),
        })

    return {
        "periodo": {"mes": mes, "ano": ano},
        "resumo": {
            "receitas_pagas": total_receitas,
            "receitas_pendentes": float(rpend[0] or 0),
            "despesas_pagas": total_despesas,
            "despesas_pendentes": float(dpend[0] or 0),
            "lucro_liquido": lucro,
            "margem_lucro": margem,
            "total_lancamentos": int((rp[1] or 0) + (dp[1] or 0)),
        },
        "por_categoria": por_categoria,
        "historico_6_meses": historico,
    }

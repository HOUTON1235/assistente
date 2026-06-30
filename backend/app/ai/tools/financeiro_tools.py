"""
Ferramentas do agente financeiro — executam ações reais no banco.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime

from app.models.financeiro import Transacao, TipoTransacaoEnum, StatusTransacaoEnum, CategoriaEnum
from app.models.cliente import Cliente


async def criar_transacao(
    db: AsyncSession,
    empresa_id: str,
    tipo: str,
    descricao: str,
    valor: float,
    categoria: str = "outros",
    cliente_nome: str | None = None,
    data_vencimento: str | None = None,
) -> dict:
    """Cria uma nova transação financeira (receita ou despesa)."""
    # Buscar cliente se informado
    cliente_id = None
    if cliente_nome:
        result = await db.execute(
            select(Cliente).where(
                Cliente.empresa_id == empresa_id,
                Cliente.nome.ilike(f"%{cliente_nome}%"),
                Cliente.ativo == True,
            ).limit(1)
        )
        cliente = result.scalar_one_or_none()
        if cliente:
            cliente_id = cliente.id

    # Validar tipo
    tipo_enum = TipoTransacaoEnum.receita if tipo.lower() in ("receita", "entrada", "venda") else TipoTransacaoEnum.despesa

    # Validar categoria
    categorias_validas = [c.value for c in CategoriaEnum]
    cat = categoria.lower() if categoria.lower() in categorias_validas else "outros"

    # Converter data
    vencimento = None
    if data_vencimento:
        try:
            vencimento = datetime.fromisoformat(data_vencimento)
        except Exception:
            pass

    transacao = Transacao(
        empresa_id=empresa_id,
        cliente_id=cliente_id,
        tipo=tipo_enum,
        categoria=cat,
        descricao=descricao,
        valor=valor,
        status=StatusTransacaoEnum.pendente,
        data_vencimento=vencimento,
    )
    db.add(transacao)
    await db.flush()

    return {
        "id": transacao.id,
        "tipo": tipo_enum.value,
        "descricao": descricao,
        "valor": valor,
        "status": "pendente",
    }


async def marcar_pago(db: AsyncSession, empresa_id: str, descricao_busca: str) -> dict:
    """Marca uma transação como paga buscando pela descrição."""
    result = await db.execute(
        select(Transacao).where(
            Transacao.empresa_id == empresa_id,
            Transacao.descricao.ilike(f"%{descricao_busca}%"),
            Transacao.status == StatusTransacaoEnum.pendente,
        ).order_by(Transacao.criado_em.desc()).limit(1)
    )
    transacao = result.scalar_one_or_none()
    if not transacao:
        return {"erro": f"Nenhuma transação pendente encontrada com '{descricao_busca}'"}

    transacao.status = StatusTransacaoEnum.pago
    transacao.data_pagamento = datetime.now()
    await db.flush()
    return {"mensagem": f"Transação '{transacao.descricao}' marcada como paga", "valor": float(transacao.valor)}


async def cancelar_transacao(db: AsyncSession, empresa_id: str, descricao_busca: str) -> dict:
    """Cancela uma transação pendente."""
    result = await db.execute(
        select(Transacao).where(
            Transacao.empresa_id == empresa_id,
            Transacao.descricao.ilike(f"%{descricao_busca}%"),
            Transacao.status == StatusTransacaoEnum.pendente,
        ).order_by(Transacao.criado_em.desc()).limit(1)
    )
    transacao = result.scalar_one_or_none()
    if not transacao:
        return {"erro": f"Nenhuma transação pendente encontrada com '{descricao_busca}'"}

    transacao.status = StatusTransacaoEnum.cancelado
    await db.flush()
    return {"mensagem": f"Transação '{transacao.descricao}' cancelada"}


async def editar_transacao(
    db: AsyncSession,
    empresa_id: str,
    descricao_busca: str,
    nova_descricao: str | None = None,
    novo_valor: float | None = None,
    nova_categoria: str | None = None,
) -> dict:
    """Edita uma transação existente."""
    result = await db.execute(
        select(Transacao).where(
            Transacao.empresa_id == empresa_id,
            Transacao.descricao.ilike(f"%{descricao_busca}%"),
        ).order_by(Transacao.criado_em.desc()).limit(1)
    )
    transacao = result.scalar_one_or_none()
    if not transacao:
        return {"erro": f"Transação '{descricao_busca}' não encontrada"}

    if nova_descricao:
        transacao.descricao = nova_descricao
    if novo_valor is not None:
        transacao.valor = novo_valor
    if nova_categoria:
        categorias_validas = [c.value for c in CategoriaEnum]
        if nova_categoria.lower() in categorias_validas:
            transacao.categoria = nova_categoria.lower()

    await db.flush()
    return {"mensagem": f"Transação atualizada", "descricao": transacao.descricao, "valor": float(transacao.valor)}


async def resumo_financeiro(db: AsyncSession, empresa_id: str) -> dict:
    """Retorna resumo financeiro completo."""
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
    pendentes = await db.execute(
        select(func.count(), func.sum(Transacao.valor)).where(
            Transacao.empresa_id == empresa_id,
            Transacao.status == StatusTransacaoEnum.pendente,
        )
    )
    vencidas_result = await db.execute(
        select(Transacao).where(
            Transacao.empresa_id == empresa_id,
            Transacao.status == StatusTransacaoEnum.vencido,
        ).limit(5)
    )

    total_r = float(receitas.scalar() or 0)
    total_d = float(despesas.scalar() or 0)
    pend = pendentes.one()
    vencidas = vencidas_result.scalars().all()

    return {
        "receitas_pagas": total_r,
        "despesas_pagas": total_d,
        "saldo": total_r - total_d,
        "pendentes_count": pend[0] or 0,
        "pendentes_valor": float(pend[1] or 0),
        "vencidas": [{"descricao": v.descricao, "valor": float(v.valor)} for v in vencidas],
    }


async def listar_transacoes_recentes(db: AsyncSession, empresa_id: str, tipo: str | None = None) -> list:
    """Lista as últimas transações."""
    query = select(Transacao).where(Transacao.empresa_id == empresa_id)
    if tipo:
        tipo_enum = TipoTransacaoEnum.receita if "receita" in tipo.lower() else TipoTransacaoEnum.despesa
        query = query.where(Transacao.tipo == tipo_enum)
    query = query.order_by(Transacao.criado_em.desc()).limit(10)
    result = await db.execute(query)
    transacoes = result.scalars().all()
    return [
        {"descricao": t.descricao, "valor": float(t.valor), "tipo": t.tipo.value, "status": t.status.value}
        for t in transacoes
    ]

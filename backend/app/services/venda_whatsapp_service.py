"""
Serviço de vendas via WhatsApp.
Processa pedidos confirmados: cadastra cliente, lança receita, notifica o dono.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone

from app.models.cliente import Cliente
from app.models.financeiro import Transacao, TipoTransacaoEnum, StatusTransacaoEnum
from app.models.notificacao import Notificacao, TipoNotificacaoEnum
from app.core.logging import get_logger
import uuid

logger = get_logger("venda_whatsapp")


async def processar_pedido(
    db: AsyncSession,
    empresa_id: str,
    pedido: dict,
) -> dict:
    """
    Processa um pedido confirmado via WhatsApp.
    Cadastra cliente, lança receita e notifica o dono.
    """
    descricao  = pedido.get("descricao") or "Pedido via WhatsApp"
    valor      = float(pedido.get("valor_total", 0.0))
    nome_cli   = pedido.get("cliente_nome") or "Cliente WhatsApp"
    numero_cli = pedido.get("cliente_numero") or ""
    observacoes = pedido.get("observacoes") or ""
    itens      = pedido.get("itens", [])

    resultado = {}

    # ── 1. Cadastra ou atualiza cliente ──────────────────────────────────────
    cliente = None
    tel_busca = "".join(filter(str.isdigit, numero_cli))

    if tel_busca:
        r = await db.execute(
            select(Cliente).where(
                Cliente.empresa_id == empresa_id,
                Cliente.telefone.like(f"%{tel_busca[-8:]}%"),
            )
        )
        cliente = r.scalar_one_or_none()

    if not cliente:
        cliente = Cliente(
            empresa_id=empresa_id,
            nome=nome_cli,
            telefone=tel_busca or numero_cli,
            observacoes=f"Captado via WhatsApp em {datetime.now(timezone.utc).strftime('%d/%m/%Y às %H:%M')}",
        )
        db.add(cliente)
        await db.flush()
        resultado["cliente"] = {"id": cliente.id, "nome": cliente.nome, "novo": True}
        logger.info(f"[Venda WA] Novo cliente: {cliente.nome}")
    else:
        # Atualiza nome se tiver
        if nome_cli and nome_cli != numero_cli and not cliente.nome.startswith("Cliente"):
            pass  # mantém nome existente
        resultado["cliente"] = {"id": cliente.id, "nome": cliente.nome, "novo": False}

    # ── 2. Lança receita no financeiro ───────────────────────────────────────
    if valor > 0:
        itens_desc = ", ".join(itens) if itens else descricao
        transacao = Transacao(
            empresa_id=empresa_id,
            tipo=TipoTransacaoEnum.receita,
            descricao=f"Pedido WA: {itens_desc[:100]}" + (f" — {nome_cli}" if nome_cli != numero_cli else ""),
            valor=valor,
            categoria="vendas",
            status=StatusTransacaoEnum.pago,
            data_vencimento=datetime.now(timezone.utc),
        )
        db.add(transacao)
        await db.flush()
        resultado["transacao"] = {"id": transacao.id, "valor": valor}
        logger.info(f"[Venda WA] Receita lançada: R$ {valor} (empresa {empresa_id})")
    else:
        resultado["transacao"] = None

    # ── 3. Notificação para o dono ───────────────────────────────────────────
    valor_fmt = f"R$ {valor:.2f}" if valor > 0 else "valor a confirmar"
    itens_curto = (", ".join(itens[:2]) + ("..." if len(itens) > 2 else "")) if itens else descricao[:40]
    obs_notif = f" | {observacoes[:50]}" if observacoes else ""

    notif = Notificacao(
        empresa_id=empresa_id,
        tipo=TipoNotificacaoEnum.sistema,
        titulo=f"🛒 Novo pedido via WhatsApp!",
        mensagem=f"{nome_cli}: {itens_curto} — {valor_fmt}{obs_notif}",
        link="/dashboard/financeiro",
    )
    db.add(notif)
    await db.flush()
    resultado["notificacao"] = True

    logger.info(f"[Venda WA] Pedido processado: {descricao[:50]} | R$ {valor} | {nome_cli}")
    return resultado

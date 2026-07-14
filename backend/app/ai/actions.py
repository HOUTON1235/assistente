"""
Actions — funções que o Executor chama para modificar o banco.
IA não toca no banco diretamente. Tudo passa por aqui.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone

from app.models.financeiro import Transacao, TipoTransacaoEnum, StatusTransacaoEnum
from app.models.cliente import Cliente
from app.models.estoque import Produto, MovimentacaoEstoque
from app.core.logging import get_logger

logger = get_logger("actions")


async def criar_transacao(db: AsyncSession, empresa_id: str, dados: dict) -> dict:
    t = Transacao(
        empresa_id=empresa_id,
        tipo=TipoTransacaoEnum(dados.get("tipo", "despesa")),
        descricao=dados.get("descricao", ""),
        valor=float(dados.get("valor", 0)),
        categoria=dados.get("categoria", "outros"),
        status=StatusTransacaoEnum(dados.get("status", "pago")),
        data_vencimento=dados.get("data_vencimento"),
    )
    db.add(t)
    await db.flush()
    logger.info(f"[Actions] Transação criada id={t.id} empresa={empresa_id}")
    return {"id": t.id, "tipo": t.tipo.value, "valor": float(t.valor)}


async def deletar_transacao(db: AsyncSession, empresa_id: str, dados: dict) -> dict:
    result = await db.execute(
        select(Transacao).where(
            Transacao.id == dados["id"],
            Transacao.empresa_id == empresa_id,  # SEGURANÇA: garante isolamento
        )
    )
    t = result.scalar_one_or_none()
    if not t:
        raise ValueError("Transação não encontrada")
    await db.delete(t)
    await db.flush()
    return {"id": dados["id"], "deletado": True}


async def criar_cliente(db: AsyncSession, empresa_id: str, dados: dict) -> dict:
    # Verifica duplicata por email dentro da empresa
    if dados.get("email"):
        dup = await db.execute(
            select(Cliente).where(
                Cliente.empresa_id == empresa_id,
                Cliente.email == dados["email"],
            )
        )
        if dup.scalar_one_or_none():
            raise ValueError(f"Cliente com email {dados['email']} já existe")

    c = Cliente(
        empresa_id=empresa_id,
        nome=dados.get("nome", ""),
        email=dados.get("email"),
        telefone=dados.get("telefone"),
        cpf_cnpj=dados.get("cpf_cnpj"),
        observacoes=dados.get("observacoes"),
    )
    db.add(c)
    await db.flush()
    logger.info(f"[Actions] Cliente criado id={c.id} empresa={empresa_id}")
    return {"id": c.id, "nome": c.nome}


async def deletar_cliente(db: AsyncSession, empresa_id: str, dados: dict) -> dict:
    result = await db.execute(
        select(Cliente).where(
            Cliente.id == dados["id"],
            Cliente.empresa_id == empresa_id,
        )
    )
    c = result.scalar_one_or_none()
    if not c:
        raise ValueError("Cliente não encontrado")
    c.ativo = False  # Soft delete
    await db.flush()
    return {"id": dados["id"], "deletado": True}


async def criar_produto(db: AsyncSession, empresa_id: str, dados: dict) -> dict:
    p = Produto(
        empresa_id=empresa_id,
        nome=dados.get("nome", ""),
        preco_venda=float(dados.get("preco_venda", 0)),
        preco_custo=float(dados["preco_custo"]) if dados.get("preco_custo") else None,
        quantidade=int(dados.get("quantidade", 0)),
        quantidade_minima=int(dados.get("quantidade_minima", 5)),
        unidade=dados.get("unidade", "un"),
    )
    db.add(p)
    await db.flush()
    logger.info(f"[Actions] Produto criado id={p.id} empresa={empresa_id}")
    return {"id": p.id, "nome": p.nome}


async def deletar_produto(db: AsyncSession, empresa_id: str, dados: dict) -> dict:
    result = await db.execute(
        select(Produto).where(
            Produto.id == dados["id"],
            Produto.empresa_id == empresa_id,
        )
    )
    p = result.scalar_one_or_none()
    if not p:
        raise ValueError("Produto não encontrado")
    p.ativo = False
    await db.flush()
    return {"id": dados["id"], "deletado": True}


async def registrar_movimentacao(db: AsyncSession, empresa_id: str, dados: dict) -> dict:
    result = await db.execute(
        select(Produto).where(
            Produto.id == dados["produto_id"],
            Produto.empresa_id == empresa_id,
        )
    )
    p = result.scalar_one_or_none()
    if not p:
        raise ValueError("Produto não encontrado")

    qtd = int(dados.get("quantidade", 0))
    tipo = dados.get("tipo", "entrada")

    if tipo == "saida" and p.quantidade < qtd:
        raise ValueError(f"Estoque insuficiente: {p.quantidade} disponível, {qtd} solicitado")

    p.quantidade = p.quantidade + qtd if tipo == "entrada" else p.quantidade - qtd

    mov = MovimentacaoEstoque(
        produto_id=p.id,
        empresa_id=empresa_id,
        tipo=tipo,
        quantidade=qtd,
        motivo=dados.get("motivo", ""),
    )
    db.add(mov)
    await db.flush()
    logger.info(f"[Actions] Movimentação {tipo} qtd={qtd} produto={p.id} empresa={empresa_id}")
    return {"id": mov.id, "produto_id": p.id, "quantidade_atual": p.quantidade}

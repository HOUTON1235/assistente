"""
Ferramentas do agente de estoque.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.estoque import Produto, MovimentacaoEstoque


async def criar_produto(
    db: AsyncSession,
    empresa_id: str,
    nome: str,
    preco_venda: float,
    quantidade: int = 0,
    quantidade_minima: int = 5,
    unidade: str = "un",
    preco_custo: float | None = None,
) -> dict:
    """Cadastra um novo produto no estoque."""
    produto = Produto(
        empresa_id=empresa_id,
        nome=nome,
        preco_venda=preco_venda,
        preco_custo=preco_custo,
        quantidade=quantidade,
        quantidade_minima=quantidade_minima,
        unidade=unidade,
    )
    db.add(produto)
    await db.flush()
    return {"id": produto.id, "nome": nome, "quantidade": quantidade, "preco_venda": preco_venda}


async def movimentar_estoque(
    db: AsyncSession,
    empresa_id: str,
    nome_produto: str,
    tipo: str,
    quantidade: int,
    motivo: str | None = None,
) -> dict:
    """Registra entrada, saída ou ajuste de estoque."""
    result = await db.execute(
        select(Produto).where(
            Produto.empresa_id == empresa_id,
            Produto.nome.ilike(f"%{nome_produto}%"),
            Produto.ativo == True,
        ).limit(1)
    )
    produto = result.scalar_one_or_none()
    if not produto:
        return {"erro": f"Produto '{nome_produto}' não encontrado"}

    tipo_lower = tipo.lower()
    if tipo_lower in ("entrada", "compra", "recebimento"):
        produto.quantidade += quantidade
        tipo_mov = "entrada"
    elif tipo_lower in ("saida", "saída", "venda", "uso"):
        if produto.quantidade < quantidade:
            return {"erro": f"Estoque insuficiente. Disponível: {produto.quantidade} {produto.unidade}"}
        produto.quantidade -= quantidade
        tipo_mov = "saida"
    else:
        produto.quantidade = quantidade
        tipo_mov = "ajuste"

    mov = MovimentacaoEstoque(
        produto_id=produto.id,
        tipo=tipo_mov,
        quantidade=quantidade,
        motivo=motivo,
    )
    db.add(mov)
    await db.flush()

    alerta = ""
    if produto.quantidade <= produto.quantidade_minima:
        alerta = f" ⚠️ Estoque baixo! Restam apenas {produto.quantidade} {produto.unidade}."

    return {
        "produto": produto.nome,
        "tipo": tipo_mov,
        "quantidade_movida": quantidade,
        "quantidade_atual": produto.quantidade,
        "alerta": alerta,
    }


async def consultar_estoque(db: AsyncSession, empresa_id: str, nome_produto: str | None = None) -> list:
    """Consulta o estoque de produtos."""
    query = select(Produto).where(Produto.empresa_id == empresa_id, Produto.ativo == True)
    if nome_produto:
        query = query.where(Produto.nome.ilike(f"%{nome_produto}%"))
    query = query.order_by(Produto.nome).limit(20)
    result = await db.execute(query)
    produtos = result.scalars().all()
    return [
        {
            "nome": p.nome,
            "quantidade": p.quantidade,
            "minimo": p.quantidade_minima,
            "preco": float(p.preco_venda),
            "unidade": p.unidade,
            "estoque_baixo": p.quantidade <= p.quantidade_minima,
        }
        for p in produtos
    ]


async def editar_produto(
    db: AsyncSession,
    empresa_id: str,
    nome_produto: str,
    novo_nome: str | None = None,
    preco_venda: float | None = None,
    preco_custo: float | None = None,
    quantidade_minima: int | None = None,
    unidade: str | None = None,
) -> dict:
    """Edita os dados de um produto existente."""
    result = await db.execute(
        select(Produto).where(
            Produto.empresa_id == empresa_id,
            Produto.nome.ilike(f"%{nome_produto}%"),
            Produto.ativo == True,
        ).limit(1)
    )
    produto = result.scalar_one_or_none()
    if not produto:
        return {"erro": f"Produto '{nome_produto}' não encontrado"}

    if novo_nome is not None:
        produto.nome = novo_nome
    if preco_venda is not None:
        produto.preco_venda = preco_venda
    if preco_custo is not None:
        produto.preco_custo = preco_custo
    if quantidade_minima is not None:
        produto.quantidade_minima = quantidade_minima
    if unidade is not None:
        produto.unidade = unidade

    await db.flush()
    return {
        "nome": produto.nome,
        "preco_venda": float(produto.preco_venda),
        "quantidade_minima": produto.quantidade_minima,
        "unidade": produto.unidade,
        "mensagem": "Produto atualizado com sucesso",
    }


async def excluir_produto(
    db: AsyncSession,
    empresa_id: str,
    nome_produto: str,
) -> dict:
    """Desativa (exclui) um produto do estoque."""
    result = await db.execute(
        select(Produto).where(
            Produto.empresa_id == empresa_id,
            Produto.nome.ilike(f"%{nome_produto}%"),
            Produto.ativo == True,
        ).limit(1)
    )
    produto = result.scalar_one_or_none()
    if not produto:
        return {"erro": f"Produto '{nome_produto}' não encontrado"}

    produto.ativo = False
    await db.flush()
    return {"mensagem": f"Produto '{produto.nome}' removido do estoque"}
    """Retorna produtos com estoque abaixo do mínimo."""
    result = await db.execute(
        select(Produto).where(
            Produto.empresa_id == empresa_id,
            Produto.ativo == True,
            Produto.quantidade <= Produto.quantidade_minima,
        )
    )
    return [
        {"nome": p.nome, "quantidade": p.quantidade, "minimo": p.quantidade_minima, "unidade": p.unidade}
        for p in result.scalars().all()
    ]

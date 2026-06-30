"""
Ferramentas do agente de clientes.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.cliente import Cliente
from app.models.financeiro import Transacao, StatusTransacaoEnum


async def criar_cliente(
    db: AsyncSession,
    empresa_id: str,
    nome: str,
    telefone: str | None = None,
    email: str | None = None,
    cpf_cnpj: str | None = None,
    observacoes: str | None = None,
) -> dict:
    """Cadastra um novo cliente."""
    # Verificar se já existe
    result = await db.execute(
        select(Cliente).where(
            Cliente.empresa_id == empresa_id,
            Cliente.nome.ilike(nome),
            Cliente.ativo == True,
        ).limit(1)
    )
    if result.scalar_one_or_none():
        return {"aviso": f"Cliente '{nome}' já existe na base"}

    cliente = Cliente(
        empresa_id=empresa_id,
        nome=nome,
        telefone=telefone,
        email=email,
        cpf_cnpj=cpf_cnpj,
        observacoes=observacoes,
    )
    db.add(cliente)
    await db.flush()
    return {"id": cliente.id, "nome": nome, "telefone": telefone, "email": email}


async def buscar_cliente(db: AsyncSession, empresa_id: str, busca: str) -> list:
    """Busca clientes pelo nome, telefone ou email."""
    result = await db.execute(
        select(Cliente).where(
            Cliente.empresa_id == empresa_id,
            Cliente.ativo == True,
            (
                Cliente.nome.ilike(f"%{busca}%") |
                Cliente.telefone.ilike(f"%{busca}%") |
                Cliente.email.ilike(f"%{busca}%")
            ),
        ).limit(5)
    )
    clientes = result.scalars().all()
    return [
        {"nome": c.nome, "telefone": c.telefone, "email": c.email, "cpf_cnpj": c.cpf_cnpj}
        for c in clientes
    ]


async def historico_cliente(db: AsyncSession, empresa_id: str, nome_cliente: str) -> dict:
    """Retorna histórico financeiro de um cliente."""
    result = await db.execute(
        select(Cliente).where(
            Cliente.empresa_id == empresa_id,
            Cliente.nome.ilike(f"%{nome_cliente}%"),
            Cliente.ativo == True,
        ).limit(1)
    )
    cliente = result.scalar_one_or_none()
    if not cliente:
        return {"erro": f"Cliente '{nome_cliente}' não encontrado"}

    transacoes = await db.execute(
        select(Transacao).where(
            Transacao.cliente_id == cliente.id,
        ).order_by(Transacao.criado_em.desc()).limit(10)
    )
    pendentes = await db.execute(
        select(func.sum(Transacao.valor)).where(
            Transacao.cliente_id == cliente.id,
            Transacao.status == StatusTransacaoEnum.pendente,
        )
    )

    return {
        "cliente": cliente.nome,
        "telefone": cliente.telefone,
        "divida_pendente": float(pendentes.scalar() or 0),
        "ultimas_transacoes": [
            {"descricao": t.descricao, "valor": float(t.valor), "status": t.status.value}
            for t in transacoes.scalars().all()
        ],
    }


async def editar_cliente(
    db: AsyncSession,
    empresa_id: str,
    nome_cliente: str,
    novo_nome: str | None = None,
    telefone: str | None = None,
    email: str | None = None,
    cpf_cnpj: str | None = None,
    observacoes: str | None = None,
) -> dict:
    """Edita dados de um cliente existente."""
    result = await db.execute(
        select(Cliente).where(
            Cliente.empresa_id == empresa_id,
            Cliente.nome.ilike(f"%{nome_cliente}%"),
            Cliente.ativo == True,
        ).limit(1)
    )
    cliente = result.scalar_one_or_none()
    if not cliente:
        return {"erro": f"Cliente '{nome_cliente}' não encontrado"}

    if novo_nome is not None:
        cliente.nome = novo_nome
    if telefone is not None:
        cliente.telefone = telefone
    if email is not None:
        cliente.email = email
    if cpf_cnpj is not None:
        cliente.cpf_cnpj = cpf_cnpj
    if observacoes is not None:
        cliente.observacoes = observacoes

    await db.flush()
    return {"mensagem": f"Cliente '{cliente.nome}' atualizado com sucesso", "nome": cliente.nome, "telefone": cliente.telefone}


async def excluir_cliente(db: AsyncSession, empresa_id: str, nome_cliente: str) -> dict:
    """Desativa um cliente da base."""
    result = await db.execute(
        select(Cliente).where(
            Cliente.empresa_id == empresa_id,
            Cliente.nome.ilike(f"%{nome_cliente}%"),
            Cliente.ativo == True,
        ).limit(1)
    )
    cliente = result.scalar_one_or_none()
    if not cliente:
        return {"erro": f"Cliente '{nome_cliente}' não encontrado"}
    cliente.ativo = False
    await db.flush()
    return {"mensagem": f"Cliente '{cliente.nome}' removido da base"}


async def listar_clientes(db: AsyncSession, empresa_id: str) -> dict:
    """Retorna total e lista resumida de clientes."""
    total = await db.execute(
        select(func.count()).where(Cliente.empresa_id == empresa_id, Cliente.ativo == True)
    )
    result = await db.execute(
        select(Cliente).where(
            Cliente.empresa_id == empresa_id, Cliente.ativo == True
        ).order_by(Cliente.nome).limit(10)
    )
    clientes = result.scalars().all()
    return {
        "total": total.scalar(),
        "clientes": [{"nome": c.nome, "telefone": c.telefone} for c in clientes],
    }

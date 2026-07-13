from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.models.admin import Admin
from app.models.empresa import Empresa, PlanoEnum, StatusEmpresaEnum
from app.models.usuario import Usuario
from app.models.assinatura import Assinatura
from app.models.financeiro import Transacao
from app.models.conversa import Mensagem
from app.api.deps import get_current_admin

router = APIRouter()


class AdminLoginRequest(BaseModel):
    email: EmailStr
    senha: str


class AdminTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin_id: str
    perfil: str


class AtualizarPlanoRequest(BaseModel):
    plano: str
    status: Optional[str] = None


class CriarAdminRequest(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    perfil: str = "suporte"


# ── Auth Admin ────────────────────────────────────────────────────────────────

@router.post("/login", response_model=AdminTokenResponse)
async def admin_login(payload: AdminLoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Admin).where(Admin.email == payload.email))
    admin = result.scalar_one_or_none()

    if not admin or not verify_password(payload.senha, admin.senha_hash):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    if not admin.ativo:
        raise HTTPException(status_code=403, detail="Conta desativada")

    admin.ultimo_acesso = datetime.now(timezone.utc)
    await db.flush()

    token = create_access_token(subject=f"admin:{admin.id}")
    return AdminTokenResponse(access_token=token, admin_id=admin.id, perfil=admin.perfil.value)


@router.post("/criar-admin", status_code=201)
async def criar_admin(payload: CriarAdminRequest, db: AsyncSession = Depends(get_db)):
    """Cria o primeiro admin (protegido por secret key no header)."""
    result = await db.execute(select(Admin).where(Admin.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    admin = Admin(
        nome=payload.nome,
        email=payload.email,
        senha_hash=get_password_hash(payload.senha),
        perfil=payload.perfil,
    )
    db.add(admin)
    await db.flush()
    return {"mensagem": "Admin criado com sucesso", "id": admin.id}


# ── Dashboard Admin ───────────────────────────────────────────────────────────

@router.get("/dashboard")
async def admin_dashboard(
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Visão geral do negócio — métricas principais."""
    agora = datetime.now(timezone.utc)
    inicio_mes = agora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Total de empresas
    total_empresas = await db.execute(select(func.count()).select_from(Empresa))

    # Trials ativos
    trials_ativos = await db.execute(
        select(func.count()).where(
            Empresa.plano == PlanoEnum.trial,
            Empresa.trial_expira_em > agora,
            Empresa.ativo == True,
        )
    )

    # Empresas pagas (plano ativo)
    pagas = await db.execute(
        select(func.count()).where(
            Empresa.plano != PlanoEnum.trial,
            Empresa.status == StatusEmpresaEnum.ativa,
            Empresa.ativo == True,
        )
    )

    # Trials expirando em 7 dias
    expirando = await db.execute(
        select(func.count()).where(
            Empresa.plano == PlanoEnum.trial,
            Empresa.trial_expira_em > agora,
            Empresa.trial_expira_em <= agora + timedelta(days=7),
        )
    )

    # Trials expirados (churned)
    expirados = await db.execute(
        select(func.count()).where(
            Empresa.plano == PlanoEnum.trial,
            Empresa.trial_expira_em < agora,
        )
    )

    # Novos cadastros este mês
    novos_mes = await db.execute(
        select(func.count()).where(Empresa.criado_em >= inicio_mes)
    )

    # MRR estimado
    mrr_result = await db.execute(
        select(func.sum(Assinatura.valor)).where(
            Assinatura.status == "ativa",
            Assinatura.expira_em > agora,
        )
    )

    # Total de usuários
    total_usuarios = await db.execute(select(func.count()).select_from(Usuario))

    # Mensagens de IA hoje
    hoje = agora.replace(hour=0, minute=0, second=0, microsecond=0)
    msgs_hoje = await db.execute(
        select(func.count()).where(Mensagem.criado_em >= hoje)
    )

    total_e = total_empresas.scalar() or 0
    pagas_n = pagas.scalar() or 0

    return {
        "empresas": {
            "total": total_e,
            "trials_ativos": trials_ativos.scalar() or 0,
            "pagas": pagas_n,
            "expirando_7dias": expirando.scalar() or 0,
            "trials_expirados": expirados.scalar() or 0,
            "novos_este_mes": novos_mes.scalar() or 0,
            "taxa_conversao": round((pagas_n / total_e * 100), 1) if total_e > 0 else 0,
        },
        "financeiro": {
            "mrr": float(mrr_result.scalar() or 0),
            "arr": float((mrr_result.scalar() or 0) * 12),
        },
        "usuarios": {
            "total": total_usuarios.scalar() or 0,
        },
        "ia": {
            "mensagens_hoje": msgs_hoje.scalar() or 0,
        },
    }


# ── Gestão de Empresas ────────────────────────────────────────────────────────

@router.get("/empresas")
async def listar_empresas(
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(20, ge=1, le=100),
    busca: Optional[str] = Query(None),
    plano: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(Empresa)
    if busca:
        query = query.where(
            Empresa.nome.ilike(f"%{busca}%") | Empresa.email.ilike(f"%{busca}%")
        )
    if plano:
        query = query.where(Empresa.plano == plano)
    if status:
        query = query.where(Empresa.status == status)

    total_q = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_q.scalar() or 0

    query = query.order_by(Empresa.criado_em.desc())
    query = query.offset((pagina - 1) * por_pagina).limit(por_pagina)
    result = await db.execute(query)
    empresas = result.scalars().all()

    return {
        "total": total,
        "pagina": pagina,
        "por_pagina": por_pagina,
        "empresas": [
            {
                "id": e.id,
                "nome": e.nome,
                "email": e.email,
                "cnpj": e.cnpj,
                "plano": e.plano.value,
                "status": e.status.value,
                "trial_dias_restantes": e.trial_dias_restantes,
                "ativo": e.ativo,
                "criado_em": e.criado_em.isoformat() if e.criado_em else None,
            }
            for e in empresas
        ],
    }


@router.get("/empresas/{empresa_id}")
async def detalhe_empresa(
    empresa_id: str,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    empresa = await db.get(Empresa, empresa_id)
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    # Usuários
    usuarios_r = await db.execute(
        select(Usuario).where(Usuario.empresa_id == empresa_id)
    )
    usuarios = usuarios_r.scalars().all()

    # Histórico de assinaturas
    assinaturas_r = await db.execute(
        select(Assinatura).where(Assinatura.empresa_id == empresa_id).order_by(Assinatura.criado_em.desc())
    )
    assinaturas = assinaturas_r.scalars().all()

    # Uso
    total_transacoes = await db.execute(
        select(func.count()).where(Transacao.empresa_id == empresa_id)
    )
    total_msgs = await db.execute(
        select(func.count(Mensagem.id))
        .join(Mensagem.conversa)
        .where(Mensagem.conversa.has(empresa_id=empresa_id))
    )

    return {
        "empresa": {
            "id": empresa.id,
            "nome": empresa.nome,
            "email": empresa.email,
            "cnpj": empresa.cnpj,
            "telefone": empresa.telefone,
            "plano": empresa.plano.value,
            "status": empresa.status.value,
            "trial_expira_em": empresa.trial_expira_em.isoformat() if empresa.trial_expira_em else None,
            "trial_dias_restantes": empresa.trial_dias_restantes,
            "cidade": empresa.cidade,
            "estado": empresa.estado,
            "criado_em": empresa.criado_em.isoformat() if empresa.criado_em else None,
            "ativo": empresa.ativo,
        },
        "usuarios": [
            {"nome": u.nome, "email": u.email, "perfil": u.perfil.value, "ativo": u.ativo}
            for u in usuarios
        ],
        "assinaturas": [
            {"plano": a.plano, "status": a.status.value, "valor": float(a.valor or 0)}
            for a in assinaturas
        ],
        "uso": {
            "total_transacoes": total_transacoes.scalar() or 0,
        },
    }


@router.patch("/empresas/{empresa_id}/plano")
async def atualizar_plano_empresa(
    empresa_id: str,
    payload: AtualizarPlanoRequest,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Força atualização de plano de uma empresa (admin)."""
    empresa = await db.get(Empresa, empresa_id)
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    planos_validos = [p.value for p in PlanoEnum]
    if payload.plano not in planos_validos:
        raise HTTPException(status_code=400, detail=f"Plano inválido. Use: {planos_validos}")

    empresa.plano = PlanoEnum(payload.plano)
    if payload.status:
        empresa.status = StatusEmpresaEnum(payload.status)

    await db.flush()
    return {"mensagem": f"Plano atualizado para {payload.plano}"}


@router.patch("/empresas/{empresa_id}/bloquear")
async def bloquear_empresa(
    empresa_id: str,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    empresa = await db.get(Empresa, empresa_id)
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    empresa.ativo = False
    empresa.status = StatusEmpresaEnum.suspensa
    await db.flush()
    return {"mensagem": "Empresa suspensa"}


@router.patch("/empresas/{empresa_id}/desbloquear")
async def desbloquear_empresa(
    empresa_id: str,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    empresa = await db.get(Empresa, empresa_id)
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    empresa.ativo = True
    empresa.status = StatusEmpresaEnum.ativa
    await db.flush()
    return {"mensagem": "Empresa reativada"}


# ── Gestão de Trials ─────────────────────────────────────────────────────────

@router.get("/trials")
async def listar_trials(
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Lista todos os trials com status detalhado."""
    agora = datetime.now(timezone.utc)
    result = await db.execute(
        select(Empresa).where(Empresa.plano == PlanoEnum.trial).order_by(Empresa.trial_expira_em)
    )
    empresas = result.scalars().all()

    return {
        "trials": [
            {
                "id": e.id,
                "nome": e.nome,
                "email": e.email,
                "dias_restantes": e.trial_dias_restantes,
                "expira_em": e.trial_expira_em.isoformat() if e.trial_expira_em else None,
                "expirado": e.trial_expira_em < agora if e.trial_expira_em else True,
                "criado_em": e.criado_em.isoformat() if e.criado_em else None,
            }
            for e in empresas
        ]
    }


@router.patch("/trials/{empresa_id}/estender")
async def estender_trial(
    empresa_id: str,
    dias: int = Query(7, ge=1, le=90),
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Estende o trial de uma empresa."""
    empresa = await db.get(Empresa, empresa_id)
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    base = empresa.trial_expira_em or datetime.now(timezone.utc)
    empresa.trial_expira_em = base + timedelta(days=dias)
    await db.flush()
    return {"mensagem": f"Trial estendido por {dias} dias", "nova_expiracao": empresa.trial_expira_em.isoformat()}

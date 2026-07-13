from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta

from app.core.database import get_db
from app.api.deps import get_current_usuario
from app.models.empresa import Empresa, PlanoEnum, StatusEmpresaEnum
from app.models.assinatura import Assinatura, StatusAssinaturaEnum
from app.services.pagamento_service import criar_preferencia_pagamento, verificar_pagamento, PLANOS

router = APIRouter()


class AssinarRequest(BaseModel):
    plano: str


@router.get("/planos")
async def listar_planos():
    """Lista os planos disponíveis com preços."""
    return {
        "planos": [
            {
                "id": plano_id,
                "nome": info["nome"],
                "valor": info["valor"],
                "descricao": info["descricao"],
                "max_usuarios": info["max_usuarios"],
            }
            for plano_id, info in PLANOS.items()
        ]
    }


@router.post("/assinar")
async def assinar(
    payload: AssinarRequest,
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    """Cria uma preferência de pagamento no Mercado Pago."""
    empresa = await db.get(Empresa, usuario.empresa_id)
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    resultado = await criar_preferencia_pagamento(
        empresa_id=empresa.id,
        empresa_nome=empresa.nome,
        email_pagador=empresa.email,
        plano=payload.plano,
    )

    if "erro" in resultado:
        raise HTTPException(status_code=400, detail=resultado["erro"])

    # Salvar preference_id na assinatura
    assinatura = Assinatura(
        empresa_id=empresa.id,
        plano=payload.plano,
        status=StatusAssinaturaEnum.ativa,
        valor=PLANOS[payload.plano]["valor"],
        mp_preference_id=resultado["preference_id"],
    )
    db.add(assinatura)
    await db.flush()

    return resultado


@router.post("/webhook")
async def webhook_mercadopago(request: Request, db: AsyncSession = Depends(get_db)):
    """Recebe notificações do Mercado Pago e atualiza o plano da empresa."""
    body = await request.json()

    tipo = body.get("type", "")
    if tipo != "payment":
        return {"status": "ignored"}

    payment_id = str(body.get("data", {}).get("id", ""))
    if not payment_id:
        return {"status": "no_payment_id"}

    pagamento = await verificar_pagamento(payment_id)
    if "erro" in pagamento:
        return {"status": "payment_not_found"}

    if pagamento["status"] != "approved":
        return {"status": "not_approved", "payment_status": pagamento["status"]}

    # Extrair empresa_id e plano da referência
    referencia = pagamento.get("referencia", "")
    if ":" not in referencia:
        return {"status": "invalid_reference"}

    empresa_id, plano_id = referencia.split(":", 1)

    empresa = await db.get(Empresa, empresa_id)
    if not empresa:
        return {"status": "empresa_not_found"}

    if plano_id not in PLANOS:
        return {"status": "invalid_plan"}

    info = PLANOS[plano_id]

    # Atualizar empresa
    empresa.plano = PlanoEnum(plano_id)
    empresa.status = StatusEmpresaEnum.ativa
    empresa.max_usuarios = info["max_usuarios"]
    empresa.max_transacoes_mes = info["max_transacoes"]

    # Atualizar assinatura
    result = await db.execute(
        select(Assinatura).where(
            Assinatura.empresa_id == empresa_id,
            Assinatura.mp_preference_id.isnot(None),
        ).order_by(Assinatura.criado_em.desc()).limit(1)
    )
    assinatura = result.scalar_one_or_none()
    if assinatura:
        assinatura.status = StatusAssinaturaEnum.ativa
        assinatura.mp_payment_id = payment_id
        assinatura.expira_em = datetime.now(timezone.utc) + timedelta(days=30)

    await db.flush()
    return {"status": "updated", "empresa": empresa_id, "plano": plano_id}


@router.get("/status")
async def status_assinatura(
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    """Retorna o status da assinatura da empresa."""
    empresa = await db.get(Empresa, usuario.empresa_id)
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    return {
        "plano": empresa.plano.value,
        "status": empresa.status.value,
        "trial_ativo": empresa.trial_ativo,
        "trial_dias_restantes": empresa.trial_dias_restantes,
        "trial_expira_em": empresa.trial_expira_em.isoformat() if empresa.trial_expira_em else None,
    }

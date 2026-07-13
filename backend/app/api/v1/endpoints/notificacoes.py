from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.api.deps import get_current_usuario
from app.models.notificacao import Notificacao

router = APIRouter()


@router.get("/")
async def listar(
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    """Lista as últimas 20 notificações não lidas da empresa."""
    result = await db.execute(
        select(Notificacao)
        .where(Notificacao.empresa_id == usuario.empresa_id)
        .order_by(Notificacao.criado_em.desc())
        .limit(20)
    )
    notifs = result.scalars().all()

    nao_lidas = sum(1 for n in notifs if not n.lida)

    return {
        "total_nao_lidas": nao_lidas,
        "notificacoes": [
            {
                "id": n.id,
                "tipo": n.tipo.value,
                "titulo": n.titulo,
                "mensagem": n.mensagem,
                "lida": n.lida,
                "link": n.link,
                "criado_em": n.criado_em.isoformat(),
            }
            for n in notifs
        ],
    }


@router.patch("/{notif_id}/lida")
async def marcar_lida(
    notif_id: str,
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    notif = await db.get(Notificacao, notif_id)
    if notif and notif.empresa_id == usuario.empresa_id:
        notif.lida = True
        await db.flush()
    return {"ok": True}


@router.patch("/marcar-todas-lidas")
async def marcar_todas_lidas(
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notificacao).where(
            Notificacao.empresa_id == usuario.empresa_id,
            Notificacao.lida == False,
        )
    )
    for n in result.scalars().all():
        n.lida = True
    await db.flush()
    return {"ok": True}

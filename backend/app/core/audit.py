"""
Serviço de auditoria — helpers para registrar ações.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog


async def registrar_acao(
    db: AsyncSession,
    acao: str,
    recurso: str,
    empresa_id: str | None = None,
    usuario_id: str | None = None,
    recurso_id: str | None = None,
    dados_antes: dict | None = None,
    dados_depois: dict | None = None,
    ip: str | None = None,
    user_agent: str | None = None,
    request_id: str | None = None,
) -> None:
    """Registra uma ação no log de auditoria (fire-and-forget, não bloqueia)."""
    try:
        log = AuditLog(
            empresa_id=empresa_id,
            usuario_id=usuario_id,
            acao=acao,
            recurso=recurso,
            recurso_id=recurso_id,
            dados_antes=dados_antes,
            dados_depois=dados_depois,
            ip=ip,
            user_agent=user_agent,
            request_id=request_id,
        )
        db.add(log)
        # Não dá flush aqui — o commit da request vai incluir junto
    except Exception as e:
        # Auditoria nunca deve quebrar a operação principal
        print(f"[Audit] Erro ao registrar: {e}")

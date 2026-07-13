"""
Serviço de alertas automáticos — roda periodicamente via scheduler.
Verifica contas vencendo e envia alertas por email + salva notificação no banco.
"""
import resend
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.models.financeiro import Transacao, StatusTransacaoEnum, TipoTransacaoEnum
from app.models.usuario import Usuario
from app.models.empresa import Empresa


async def verificar_vencimentos(db: AsyncSession):
    """
    Roda diariamente. Verifica:
    1. Transações que vencem hoje → marca como vencido + envia email
    2. Transações que vencem em 3 dias → envia alerta preventivo
    3. Trial expirando em 7, 3 e 1 dia → envia email de conversão
    """
    agora = datetime.now(timezone.utc)
    hoje = agora.date()
    em_3_dias = (agora + timedelta(days=3)).date()

    # ── 1. Marcar transações como vencidas ───────────────────────────────────
    result = await db.execute(
        select(Transacao).where(
            Transacao.status == StatusTransacaoEnum.pendente,
            Transacao.data_vencimento.isnot(None),
            Transacao.data_vencimento < agora,
        )
    )
    transacoes_vencidas = result.scalars().all()

    for t in transacoes_vencidas:
        t.status = StatusTransacaoEnum.vencido

    await db.flush()
    print(f"[Alertas] {len(transacoes_vencidas)} transações marcadas como vencidas")

    # ── 2. Alertas de vencimento em 3 dias ───────────────────────────────────
    result3 = await db.execute(
        select(Transacao, Empresa).join(Empresa, Transacao.empresa_id == Empresa.id).where(
            Transacao.status == StatusTransacaoEnum.pendente,
            Transacao.data_vencimento.isnot(None),
            Transacao.data_vencimento >= agora,
            Transacao.data_vencimento <= agora + timedelta(days=3),
        )
    )
    proximas = result3.all()

    for transacao, empresa in proximas:
        # Busca admin da empresa
        admin_result = await db.execute(
            select(Usuario).where(
                Usuario.empresa_id == empresa.id,
                Usuario.perfil == "admin",
                Usuario.ativo == True,
            ).limit(1)
        )
        admin = admin_result.scalar_one_or_none()
        if admin:
            await _enviar_alerta_vencimento(
                email=admin.email,
                nome=admin.nome,
                descricao=transacao.descricao,
                valor=float(transacao.valor),
                vencimento=transacao.data_vencimento,
                tipo=transacao.tipo.value,
            )

    # ── 3. Alertas de trial expirando ────────────────────────────────────────
    from app.models.empresa import PlanoEnum
    for dias_alerta in [7, 3, 1]:
        data_alvo = agora + timedelta(days=dias_alerta)
        result_trial = await db.execute(
            select(Empresa).where(
                Empresa.plano == PlanoEnum.trial,
                Empresa.ativo == True,
                Empresa.trial_expira_em >= data_alvo,
                Empresa.trial_expira_em < data_alvo + timedelta(hours=24),
            )
        )
        empresas_alerta = result_trial.scalars().all()

        for empresa in empresas_alerta:
            admin_result = await db.execute(
                select(Usuario).where(
                    Usuario.empresa_id == empresa.id,
                    Usuario.perfil == "admin",
                    Usuario.ativo == True,
                ).limit(1)
            )
            admin = admin_result.scalar_one_or_none()
            if admin:
                from app.services.email_service import enviar_alerta_trial_expirando
                await enviar_alerta_trial_expirando(admin.email, admin.nome, dias_alerta)
                print(f"[Alertas] Trial expirando em {dias_alerta} dias — {empresa.nome}")

    await db.commit()
    print(f"[Alertas] Verificação concluída em {agora.strftime('%d/%m/%Y %H:%M')}")


async def _enviar_alerta_vencimento(
    email: str,
    nome: str,
    descricao: str,
    valor: float,
    vencimento: datetime,
    tipo: str,
):
    resend.api_key = settings.RESEND_API_KEY
    tipo_label = "Receita a receber" if tipo == "receita" else "Conta a pagar"
    cor = "#22c55e" if tipo == "receita" else "#ef4444"
    data_fmt = vencimento.strftime("%d/%m/%Y") if vencimento else "—"
    valor_fmt = f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    try:
        resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": [email],
            "subject": f"⚠️ Vencimento em 3 dias: {descricao}",
            "html": f"""
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <h2 style="color:{cor}">⚠️ {tipo_label} vencendo em breve</h2>
              <p>Olá, <strong>{nome}</strong>!</p>
              <p>Uma transação está prestes a vencer:</p>
              <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin:16px 0">
                <p style="margin:0"><strong>{descricao}</strong></p>
                <p style="margin:4px 0;color:#666">Valor: <strong style="color:{cor}">{valor_fmt}</strong></p>
                <p style="margin:4px 0;color:#666">Vencimento: <strong>{data_fmt}</strong></p>
              </div>
              <a href="{settings.FRONTEND_URL}/dashboard/financeiro"
                 style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
                Ver no sistema
              </a>
              <p style="color:#888;font-size:13px;margin-top:16px">
                Acesse o Assistente IA para registrar o pagamento.
              </p>
            </div>
            """,
        })
    except Exception as e:
        print(f"[Alertas] Erro ao enviar email para {email}: {e}")

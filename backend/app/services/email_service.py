"""
Serviço de email usando Resend.
"""
import resend
from app.core.config import settings


def _init():
    resend.api_key = settings.RESEND_API_KEY


async def enviar_verificacao_email(email: str, nome: str, token: str) -> bool:
    """Envia email de verificação de conta."""
    _init()
    url = f"{settings.FRONTEND_URL}/verificar-email?token={token}"
    try:
        resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": [email],
            "subject": "Verifique seu email — Assistente IA",
            "html": f"""
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <h2 style="color:#6366f1">Olá, {nome}! 👋</h2>
              <p>Obrigado por criar sua conta no <strong>Assistente IA</strong>.</p>
              <p>Clique no botão abaixo para verificar seu email e ativar sua conta:</p>
              <a href="{url}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
                Verificar meu email
              </a>
              <p style="color:#888;font-size:13px">Este link expira em 24 horas. Se não criou uma conta, ignore este email.</p>
            </div>
            """,
        })
        return True
    except Exception as e:
        print(f"[Email] Erro ao enviar verificação: {e}")
        return False


async def enviar_reset_senha(email: str, nome: str, token: str) -> bool:
    """Envia email de reset de senha."""
    _init()
    url = f"{settings.FRONTEND_URL}/nova-senha?token={token}"
    try:
        resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": [email],
            "subject": "Redefinir senha — Assistente IA",
            "html": f"""
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <h2 style="color:#6366f1">Redefinir senha</h2>
              <p>Olá, {nome}. Recebemos uma solicitação para redefinir sua senha.</p>
              <a href="{url}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
                Criar nova senha
              </a>
              <p style="color:#888;font-size:13px">Este link expira em 1 hora. Se não solicitou, ignore este email.</p>
            </div>
            """,
        })
        return True
    except Exception as e:
        print(f"[Email] Erro ao enviar reset: {e}")
        return False


async def enviar_boas_vindas_trial(email: str, nome: str, empresa: str) -> bool:
    """Envia email de boas-vindas com informações do trial."""
    _init()
    url = f"{settings.FRONTEND_URL}/dashboard"
    try:
        resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": [email],
            "subject": f"Bem-vindo ao Assistente IA, {nome}! Seu trial de 30 dias começou 🚀",
            "html": f"""
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <h2 style="color:#6366f1">Sua conta está ativa! 🎉</h2>
              <p>Olá, {nome}! A empresa <strong>{empresa}</strong> foi cadastrada com sucesso.</p>
              <p>Você tem <strong>30 dias gratuitos</strong> para explorar todas as funcionalidades do Assistente IA.</p>
              <ul style="line-height:2">
                <li>💬 Chat inteligente com IA</li>
                <li>💰 Gestão financeira completa</li>
                <li>📦 Controle de estoque</li>
                <li>👥 Gestão de clientes</li>
              </ul>
              <a href="{url}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
                Acessar minha conta
              </a>
              <p style="color:#888;font-size:13px">Após 30 dias, você pode escolher um plano a partir de R$ 79/mês.</p>
            </div>
            """,
        })
        return True
    except Exception as e:
        print(f"[Email] Erro ao enviar boas-vindas: {e}")
        return False


async def enviar_alerta_trial_expirando(email: str, nome: str, dias: int) -> bool:
    """Avisa que o trial está acabando."""
    _init()
    url = f"{settings.FRONTEND_URL}/dashboard/configuracoes/planos"
    try:
        resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": [email],
            "subject": f"Seu trial expira em {dias} dias — escolha um plano",
            "html": f"""
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <h2 style="color:#f59e0b">⏰ Seu trial termina em {dias} dias</h2>
              <p>Olá, {nome}! Para continuar usando o Assistente IA, escolha um plano.</p>
              <a href="{url}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
                Ver planos
              </a>
            </div>
            """,
        })
        return True
    except Exception as e:
        print(f"[Email] Erro ao enviar alerta trial: {e}")
        return False

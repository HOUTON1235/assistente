"""
Serviço de email usando Mailersend API.
300 emails/dia grátis, funciona sem domínio próprio.
"""
import requests as req_lib
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("email")

MAILERSEND_URL = "https://api.mailersend.com/v1/email"


async def _enviar(to: str, nome_to: str, subject: str, html: str) -> bool:
    """Envia email via Mailersend API."""
    api_key  = getattr(settings, 'MAILERSEND_API_KEY', '')
    from_email = getattr(settings, 'MAILERSEND_FROM', 'noreply@test-q3enl6k1jm042vwr.mlsender.net')
    from_name  = getattr(settings, 'MAILERSEND_FROM_NAME', 'Orbita')

    if not api_key:
        logger.warning(f"[Email] MAILERSEND_API_KEY não configurado")
        return False

    payload = {
        "from":    {"email": from_email, "name": from_name},
        "to":      [{"email": to, "name": nome_to or to}],
        "subject": subject,
        "html":    html,
    }

    try:
        r = req_lib.post(
            MAILERSEND_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=payload,
            timeout=10,
        )
        if r.status_code in (200, 201, 202):
            logger.info(f"[Email] ✓ Enviado para {to}: {subject}")
            return True
        else:
            logger.error(f"[Email] ✗ Erro {r.status_code} ao enviar para {to}: {r.text[:200]}")
            return False
    except Exception as e:
        logger.error(f"[Email] ✗ Exceção ao enviar para {to}: {e}")
        return False


async def enviar_verificacao_email(email: str, nome: str, token: str) -> bool:
    url = f"{settings.FRONTEND_URL}/verificar-email?token={token}"
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="color:#f97316">Olá, {nome}! 👋</h2>
      <p>Obrigado por criar sua conta na <strong>Orbita</strong>.</p>
      <a href="{url}" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#f97316);color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
        Verificar meu email
      </a>
      <p style="color:#888;font-size:13px">Este link expira em 24 horas.</p>
    </div>
    """
    return await _enviar(email, nome, "Verifique seu email — Orbita", html)


async def enviar_reset_senha(email: str, nome: str, token: str) -> bool:
    url = f"{settings.FRONTEND_URL}/nova-senha?token={token}"
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="color:#f97316">Redefinir senha</h2>
      <p>Olá, {nome}. Clique abaixo para criar uma nova senha:</p>
      <a href="{url}" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#f97316);color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
        Criar nova senha
      </a>
      <p style="color:#888;font-size:13px">Este link expira em 1 hora.</p>
    </div>
    """
    return await _enviar(email, nome, "Redefinir senha — Orbita", html)


async def enviar_boas_vindas_trial(email: str, nome: str, empresa: str) -> bool:
    url = f"{settings.FRONTEND_URL}/dashboard"
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="color:#f97316">Sua conta está ativa! 🎉</h2>
      <p>Olá, {nome}! A empresa <strong>{empresa}</strong> foi cadastrada.</p>
      <p>Você tem <strong>30 dias gratuitos</strong> para explorar a Orbita.</p>
      <a href="{url}" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#f97316);color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
        Acessar minha conta
      </a>
    </div>
    """
    return await _enviar(email, nome, f"Bem-vindo ao Orbita, {nome}! 🚀", html)


async def enviar_alerta_trial_expirando(email: str, nome: str, dias: int) -> bool:
    url = f"{settings.FRONTEND_URL}/dashboard/configuracoes/planos"
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="color:#f97316">⏰ Seu trial termina em {dias} dias</h2>
      <p>Olá, {nome}! Para continuar usando o Orbita, escolha um plano.</p>
      <a href="{url}" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#f97316);color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
        Ver planos
      </a>
    </div>
    """
    return await _enviar(email, nome, f"Seu trial expira em {dias} dias — Orbita", html)


async def enviar_codigo_reset(email: str, nome: str, codigo: str) -> bool:
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="color:#f97316">Redefinir senha — Orbita</h2>
      <p>Olá, {nome}! Use o código abaixo para redefinir sua senha:</p>
      <div style="background:#f3f4f6;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
        <span style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#1e40af">{codigo}</span>
      </div>
      <p style="color:#888;font-size:13px">Este código expira em 1 hora.</p>
    </div>
    """
    return await _enviar(email, nome, f"Seu código de verificação: {codigo}", html)

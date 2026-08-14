"""
Serviço de email usando Gmail SMTP.
Usa porta 587 + STARTTLS para compatibilidade com Railway.
Roda em thread separada para não bloquear o event loop async.
"""
import smtplib
import asyncio
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("email")


def _enviar_gmail_sync(to: str, subject: str, html: str) -> bool:
    """Envia email via Gmail SMTP porta 587 (STARTTLS) — síncrono."""
    gmail_user = getattr(settings, 'GMAIL_USER', '')
    gmail_pass = getattr(settings, 'GMAIL_APP_PASSWORD', '')

    if not gmail_user or not gmail_pass:
        logger.warning(f"[Email] GMAIL não configurado. Email não enviado para {to}")
        return False

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From']    = f"Orbita <{gmail_user}>"
        msg['To']      = to
        msg.attach(MIMEText(html, 'html'))

        with smtplib.SMTP('smtp.gmail.com', 587, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(gmail_user, gmail_pass)
            server.sendmail(gmail_user, to, msg.as_string())

        logger.info(f"[Email] ✓ Enviado para {to}: {subject}")
        return True
    except Exception as e:
        logger.error(f"[Email] ✗ Erro ao enviar para {to}: {e}")
        return False


async def _enviar(to: str, subject: str, html: str) -> bool:
    """Wrapper async — roda SMTP em thread para não bloquear o event loop."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _enviar_gmail_sync, to, subject, html)


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
    return await _enviar(email, "Verifique seu email — Orbita", html)


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
    return await _enviar(email, "Redefinir senha — Orbita", html)


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
    return await _enviar(email, f"Bem-vindo ao Orbita, {nome}! 🚀", html)


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
    return await _enviar(email, f"Seu trial expira em {dias} dias — Orbita", html)


async def enviar_codigo_reset(email: str, nome: str, codigo: str) -> bool:
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="color:#f97316">Redefinir senha — Orbita</h2>
      <p>Olá, {nome}! Use o código abaixo para redefinir sua senha:</p>
      <div style="background:#f3f4f6;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
        <span style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#1e40af">{codigo}</span>
      </div>
      <p style="color:#888;font-size:13px">Este código expira em 1 hora. Se não solicitou, ignore este email.</p>
    </div>
    """
    return await _enviar(email, f"Seu código de verificação: {codigo}", html)

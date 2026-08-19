"""
Serviço de email usando Mailersend API.
Design profissional com template HTML completo.
"""
import requests as req_lib
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("email")

MAILERSEND_URL = "https://api.mailersend.com/v1/email"


def _template(titulo: str, subtitulo: str, corpo: str, rodape_extra: str = "") -> str:
    """Template HTML profissional padrão Orbita."""
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{titulo}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- LOGO / HEADER -->
        <tr>
          <td align="center" style="padding:0 0 24px 0;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:linear-gradient(135deg,#1e40af,#f97316);border-radius:14px;padding:12px 20px;">
                  <span style="color:white;font-size:22px;font-weight:800;letter-spacing:1px;">Orbita</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CARD PRINCIPAL -->
        <tr>
          <td style="background:#ffffff;border-radius:16px;padding:40px 48px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

            <!-- Título -->
            <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:700;color:#0f172a;">{titulo}</h1>
            <p style="margin:0 0 28px 0;font-size:15px;color:#64748b;">{subtitulo}</p>

            <!-- Divisor -->
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 28px 0;">

            <!-- Corpo -->
            {corpo}

            <!-- Divisor rodapé -->
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0 24px 0;">

            <!-- Aviso de segurança -->
            <p style="margin:0;font-size:13px;color:#94a3b8;">
              Se você não solicitou este email, pode ignorá-lo com segurança.
              {rodape_extra}
            </p>
          </td>
        </tr>

        <!-- RODAPÉ -->
        <tr>
          <td align="center" style="padding:28px 0 8px 0;">
            <p style="margin:0 0 6px 0;font-size:13px;color:#94a3b8;">
              <strong style="color:#64748b;">Orbita</strong> — Operador Inteligente para Empresas
            </p>
            <p style="margin:0;font-size:12px;color:#cbd5e1;">
              Criado por Marcelo Rian (Houton) · 
              <a href="{settings.FRONTEND_URL}" style="color:#f97316;text-decoration:none;">{settings.FRONTEND_URL}</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


async def _enviar(to: str, nome_to: str, subject: str, html: str) -> bool:
    """Envia email via Mailersend API."""
    api_key    = getattr(settings, 'MAILERSEND_API_KEY', '')
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
            logger.error(f"[Email] ✗ Erro {r.status_code} para {to}: {r.text[:200]}")
            return False
    except Exception as e:
        logger.error(f"[Email] ✗ Exceção ao enviar para {to}: {e}")
        return False


async def enviar_verificacao_email(email: str, nome: str, token: str) -> bool:
    url = f"{settings.FRONTEND_URL}/verificar-email?token={token}"
    corpo = f"""
      <p style="font-size:15px;color:#334155;margin:0 0 20px 0;">
        Olá, <strong>{nome}</strong>! Obrigado por criar sua conta na Orbita.
      </p>
      <p style="font-size:15px;color:#334155;margin:0 0 28px 0;">
        Clique no botão abaixo para confirmar seu endereço de email e ativar sua conta:
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
        <tr>
          <td style="background:linear-gradient(135deg,#1e40af,#f97316);border-radius:10px;padding:14px 32px;">
            <a href="{url}" style="color:white;text-decoration:none;font-size:15px;font-weight:600;">
              ✓ Verificar meu email
            </a>
          </td>
        </tr>
      </table>
      <p style="font-size:13px;color:#94a3b8;margin:0;">
        Ou copie o link: <a href="{url}" style="color:#f97316;word-break:break-all;">{url}</a>
      </p>
    """
    html = _template(
        "Verifique seu email",
        "Confirme seu endereço para ativar sua conta",
        corpo,
        "Este link expira em 24 horas."
    )
    return await _enviar(email, nome, "✉️ Verifique seu email — Orbita", html)


async def enviar_reset_senha(email: str, nome: str, token: str) -> bool:
    url = f"{settings.FRONTEND_URL}/nova-senha?token={token}"
    corpo = f"""
      <p style="font-size:15px;color:#334155;margin:0 0 20px 0;">
        Olá, <strong>{nome}</strong>! Recebemos uma solicitação para redefinir a senha da sua conta.
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
        <tr>
          <td style="background:linear-gradient(135deg,#1e40af,#f97316);border-radius:10px;padding:14px 32px;">
            <a href="{url}" style="color:white;text-decoration:none;font-size:15px;font-weight:600;">
              🔐 Criar nova senha
            </a>
          </td>
        </tr>
      </table>
      <p style="font-size:13px;color:#94a3b8;margin:0;">
        Ou copie o link: <a href="{url}" style="color:#f97316;word-break:break-all;">{url}</a>
      </p>
    """
    html = _template(
        "Redefinir senha",
        "Clique no botão abaixo para criar uma nova senha",
        corpo,
        "Este link expira em 1 hora."
    )
    return await _enviar(email, nome, "🔐 Redefinir senha — Orbita", html)


async def enviar_boas_vindas_trial(email: str, nome: str, empresa: str) -> bool:
    url = f"{settings.FRONTEND_URL}/dashboard"
    corpo = f"""
      <p style="font-size:15px;color:#334155;margin:0 0 16px 0;">
        Olá, <strong>{nome}</strong>! 🎉
      </p>
      <p style="font-size:15px;color:#334155;margin:0 0 20px 0;">
        A empresa <strong>{empresa}</strong> foi cadastrada com sucesso.
        Seu período de trial de <strong>30 dias gratuitos</strong> começa agora!
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
        <tr>
          <td style="background:#f8fafc;border-radius:10px;padding:20px 24px;border:1px solid #e2e8f0;">
            <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">O que você tem acesso:</p>
            <table cellpadding="0" cellspacing="0" width="100%">
              {''.join([f'<tr><td style="padding:4px 0;font-size:14px;color:#334155;">✓ {item}</td></tr>' for item in [
                'Chat com IA — Orbita',
                'Gestão financeira completa',
                'Controle de estoque',
                'Gestão de clientes (CRM)',
                'Relatórios e análises',
                'Atendimento via WhatsApp',
              ]])}
            </table>
          </td>
        </tr>
      </table>

      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:linear-gradient(135deg,#1e40af,#f97316);border-radius:10px;padding:14px 32px;">
            <a href="{url}" style="color:white;text-decoration:none;font-size:15px;font-weight:600;">
              🚀 Acessar minha conta
            </a>
          </td>
        </tr>
      </table>
    """
    html = _template(
        "Bem-vindo à Orbita! 🚀",
        "Sua conta está ativa — 30 dias gratuitos começando agora",
        corpo
    )
    return await _enviar(email, nome, "🚀 Bem-vindo à Orbita! Sua conta está ativa", html)


async def enviar_alerta_trial_expirando(email: str, nome: str, dias: int) -> bool:
    url = f"{settings.FRONTEND_URL}/dashboard/configuracoes/planos"
    cor = "#ef4444" if dias <= 3 else "#f97316"
    corpo = f"""
      <p style="font-size:15px;color:#334155;margin:0 0 20px 0;">
        Olá, <strong>{nome}</strong>! Seu período de trial expira em
        <strong style="color:{cor};">{dias} dia{'s' if dias != 1 else ''}</strong>.
      </p>
      <p style="font-size:15px;color:#334155;margin:0 0 28px 0;">
        Para continuar usando a Orbita sem interrupções, escolha um plano agora.
      </p>
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:linear-gradient(135deg,#1e40af,#f97316);border-radius:10px;padding:14px 32px;">
            <a href="{url}" style="color:white;text-decoration:none;font-size:15px;font-weight:600;">
              Ver planos e preços
            </a>
          </td>
        </tr>
      </table>
    """
    html = _template(
        f"Seu trial expira em {dias} dia{'s' if dias != 1 else ''}",
        "Escolha um plano para continuar usando a Orbita",
        corpo
    )
    return await _enviar(email, nome, f"⏰ Seu trial Orbita expira em {dias} dias", html)


async def enviar_codigo_reset(email: str, nome: str, codigo: str) -> bool:
    corpo = f"""
      <p style="font-size:15px;color:#334155;margin:0 0 20px 0;">
        Olá, <strong>{nome}</strong>! Use o código abaixo para redefinir sua senha.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
        <tr>
          <td align="center" style="background:#f8fafc;border-radius:14px;padding:32px 24px;border:2px dashed #e2e8f0;">
            <p style="margin:0 0 8px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Seu código</p>
            <span style="font-size:48px;font-weight:800;letter-spacing:16px;color:#1e40af;font-family:'Courier New',monospace;">{codigo}</span>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#fefce8;border-radius:8px;padding:14px 18px;border-left:3px solid #f97316;">
            <p style="margin:0;font-size:13px;color:#854d0e;">
              ⏱ Este código expira em <strong>1 hora</strong>.
              Não compartilhe com ninguém.
            </p>
          </td>
        </tr>
      </table>
    """
    html = _template(
        "Código de verificação",
        "Use o código abaixo para redefinir sua senha",
        corpo,
        "Se não solicitou a redefinição, alguém pode estar tentando acessar sua conta."
    )
    return await _enviar(email, nome, f"🔑 Seu código Orbita: {codigo}", html)

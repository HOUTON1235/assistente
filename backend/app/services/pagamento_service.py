"""
Serviço de pagamentos usando Mercado Pago.
"""
import mercadopago
from app.core.config import settings

PLANOS = {
    "starter": {
        "nome": "Starter",
        "valor": 79.90,
        "descricao": "1 usuário, 500 transações/mês",
        "max_usuarios": 1,
        "max_transacoes": 500,
    },
    "professional": {
        "nome": "Professional",
        "valor": 179.90,
        "descricao": "5 usuários, transações ilimitadas",
        "max_usuarios": 5,
        "max_transacoes": 99999,
    },
    "business": {
        "nome": "Business",
        "valor": 349.90,
        "descricao": "15 usuários, WhatsApp incluído",
        "max_usuarios": 15,
        "max_transacoes": 99999,
    },
}


def _get_sdk():
    return mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)


async def criar_preferencia_pagamento(
    empresa_id: str,
    empresa_nome: str,
    email_pagador: str,
    plano: str,
) -> dict:
    """Cria uma preferência de pagamento no Mercado Pago."""
    if plano not in PLANOS:
        return {"erro": f"Plano '{plano}' inválido"}

    info = PLANOS[plano]
    sdk = _get_sdk()

    preference_data = {
        "items": [
            {
                "title": f"Assistente IA — Plano {info['nome']}",
                "quantity": 1,
                "unit_price": info["valor"],
                "currency_id": "BRL",
            }
        ],
        "payer": {"email": email_pagador},
        "external_reference": f"{empresa_id}:{plano}",
        "back_urls": {
            "success": f"{settings.FRONTEND_URL}/dashboard/configuracoes/planos?status=success&plano={plano}",
            "failure": f"{settings.FRONTEND_URL}/dashboard/configuracoes/planos?status=failure",
            "pending": f"{settings.FRONTEND_URL}/dashboard/configuracoes/planos?status=pending",
        },
        "notification_url": f"{settings.BACKEND_URL}/api/v1/pagamentos/webhook",
        "statement_descriptor": "ASSISTENTE IA",
    }

    # auto_return só funciona com URLs públicas (não localhost)
    if "localhost" not in settings.FRONTEND_URL:
        preference_data["auto_return"] = "approved"

    result = sdk.preference().create(preference_data)
    response = result["response"]

    print(f"[MercadoPago] Status: {result['status']} | Response: {response}")

    if result["status"] == 201:
        return {
            "preference_id": response["id"],
            "init_point": response["init_point"],
            "sandbox_init_point": response.get("sandbox_init_point", ""),
            "plano": plano,
            "valor": info["valor"],
        }

    # Retorna o erro real do Mercado Pago
    erro_msg = response.get("message", "Erro ao criar preferência de pagamento")
    print(f"[MercadoPago] Erro: {erro_msg}")
    return {"erro": erro_msg}


async def verificar_pagamento(payment_id: str) -> dict:
    """Verifica o status de um pagamento."""
    sdk = _get_sdk()
    result = sdk.payment().get(payment_id)
    if result["status"] == 200:
        data = result["response"]
        return {
            "id": data["id"],
            "status": data["status"],
            "status_detail": data.get("status_detail", ""),
            "valor": data.get("transaction_amount", 0),
            "referencia": data.get("external_reference", ""),
        }
    return {"erro": "Pagamento não encontrado"}

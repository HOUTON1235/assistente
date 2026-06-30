from fastapi import APIRouter, Request, HTTPException, Query
from app.core.config import settings

router = APIRouter()


@router.get("/webhook")
async def verificar_webhook(
    hub_mode: str = Query(alias="hub.mode"),
    hub_verify_token: str = Query(alias="hub.verify_token"),
    hub_challenge: str = Query(alias="hub.challenge"),
):
    """Verificação do webhook do WhatsApp Business API."""
    if hub_mode == "subscribe" and hub_verify_token == settings.WHATSAPP_VERIFY_TOKEN:
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Token inválido")


@router.post("/webhook")
async def receber_mensagem(request: Request):
    """
    Recebe mensagens do WhatsApp e encaminha para o agente IA.
    """
    body = await request.json()

    try:
        entry = body["entry"][0]
        changes = entry["changes"][0]
        value = changes["value"]

        if "messages" not in value:
            return {"status": "no_message"}

        message = value["messages"][0]
        from_number = message["from"]
        text = message.get("text", {}).get("body", "")

        if not text:
            return {"status": "unsupported_message_type"}

        # TODO: identificar empresa pelo número e processar com o agente
        # orchestrator = Orchestrator(...)
        # await orchestrator.processar(mensagem=text, canal="whatsapp")

        return {"status": "received", "from": from_number, "text": text}

    except (KeyError, IndexError):
        return {"status": "invalid_payload"}

"""
Serviço WhatsApp via servidor Baileys local (porta 8080).
"""
import httpx
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("whatsapp")
BASE = "http://localhost:8080"


async def _get(path: str) -> dict:
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(f"{BASE}{path}")
        try:
            return r.json()
        except Exception:
            return {}


async def _post(path: str, body: dict = {}) -> dict:
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(f"{BASE}{path}", json=body)
        try:
            return r.json()
        except Exception:
            return {}


async def _delete(path: str) -> dict:
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.delete(f"{BASE}{path}")
        try:
            return r.json()
        except Exception:
            return {}


async def criar_instancia(nome: str) -> dict:
    return await _post("/instancia/criar", {"nome": nome})


async def obter_qrcode(instancia: str) -> dict:
    return await _get("/instancia/qrcode")


async def status_instancia(instancia: str) -> dict:
    dados = await _get("/instancia/status")
    return {
        "conectado": dados.get("conectado", False),
        "numero": dados.get("numero"),
        "instancia": dados.get("instancia"),
        "estado": "open" if dados.get("conectado") else "close",
    }


async def deletar_instancia(instancia: str) -> dict:
    return await _delete("/instancia/deletar")


async def configurar_webhook(instancia: str, webhook_url: str) -> dict:
    # Baileys já envia pro backend automaticamente via BACKEND_WEBHOOK env
    return {"ok": True}


async def enviar_texto(instancia: str, numero: str, mensagem: str) -> dict:
    """
    Envia mensagem de texto.
    Aceita tanto número normal (5511999...) quanto JID completo (5511999...@s.whatsapp.net ou @lid).
    """
    # Se já é um JID completo com @, mantém como está
    if "@" in numero:
        jid = numero
        numero_log = numero.split("@")[0]
    else:
        # Remove não-dígitos e monta o JID
        numero_limpo = "".join(filter(str.isdigit, numero))
        jid = numero_limpo
        numero_log = numero_limpo

    dados = await _post("/mensagem/enviar", {"numero": jid, "mensagem": mensagem})
    logger.info(f"[WA] Enviado para {numero_log}: {str(dados)[:80]}")
    return dados


async def listar_instancias() -> list:
    dados = await _get("/instancia/status")
    if dados.get("instancia"):
        return [dados]
    return []

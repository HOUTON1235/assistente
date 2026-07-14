"""
Endpoints WhatsApp — Evolution API.

Fluxo:
  1. Empresa cria instância → recebe QR Code → escaneia com celular
  2. Evolution API envia mensagens recebidas via webhook para /whatsapp/webhook
  3. Webhook identifica empresa pelo nome da instância → chama Orbita → responde
"""
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.config import settings
from app.core.logging import get_logger
from app.api.deps import get_current_usuario
from app.models.whatsapp import WhatsappInstancia
from app.services.whatsapp_service import (
    criar_instancia, obter_qrcode, status_instancia,
    configurar_webhook, deletar_instancia, enviar_texto,
)

router = APIRouter()
logger = get_logger("whatsapp")

# Mapa de deduplicação para evitar processar a mesma mensagem duas vezes
_mensagens_processadas: set[str] = set()


# ── Gerenciamento de instâncias ───────────────────────────────────────────────

@router.post("/instancia/criar")
async def criar(
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    """Cria uma instância WhatsApp para a empresa."""
    # Verifica se já tem uma instância ativa
    result = await db.execute(
        select(WhatsappInstancia).where(
            WhatsappInstancia.empresa_id == usuario.empresa_id,
            WhatsappInstancia.ativo == True,
        )
    )
    existente = result.scalar_one_or_none()
    if existente:
        raise HTTPException(400, "Já existe uma instância ativa. Desconecte antes de criar outra.")

    # Nome único baseado no empresa_id (primeiros 8 chars)
    nome = f"orbita_{usuario.empresa_id[:8]}"

    try:
        dados = await criar_instancia(nome)
        logger.info(f"[WA] Instância criada: {nome} → {dados}")
    except Exception as e:
        raise HTTPException(503, f"Evolution API indisponível: {e}")

    # Configura webhook para apontar para nosso backend
    webhook_url = f"{settings.BACKEND_URL}/api/v1/whatsapp/webhook"
    try:
        await configurar_webhook(nome, webhook_url)
    except Exception as e:
        logger.warning(f"[WA] Erro ao configurar webhook: {e}")

    # Salva no banco
    instancia = WhatsappInstancia(
        empresa_id=usuario.empresa_id,
        nome_instancia=nome,
    )
    db.add(instancia)
    await db.flush()

    return {
        "instancia": nome,
        "mensagem": "Instância criada. Escaneie o QR Code para conectar.",
        "dados": dados,
    }


@router.get("/instancia/qrcode")
async def qrcode(
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    """Retorna o QR Code. Se a instância não existe na Evolution, recria."""
    inst = await _get_instancia(db, usuario.empresa_id)

    # Tenta obter o QR Code — se instância não existe na Evolution, recria
    try:
        dados = await obter_qrcode(inst.nome_instancia)

        # Instância não existe na Evolution (container foi reiniciado)
        if dados.get("status") == 404 or "does not exist" in str(dados):
            logger.warning(f"[WA] Instância {inst.nome_instancia} não existe na Evolution, recriando...")
            await criar_instancia(inst.nome_instancia)

            # Configura webhook
            webhook_url = f"{settings.BACKEND_URL}/api/v1/whatsapp/webhook"
            try:
                await configurar_webhook(inst.nome_instancia, webhook_url)
            except Exception:
                pass

            # Aguarda 2s e tenta pegar QR
            import asyncio
            await asyncio.sleep(2)
            dados = await obter_qrcode(inst.nome_instancia)

        return dados

    except Exception as e:
        raise HTTPException(503, f"Erro ao obter QR Code: {e}")


@router.get("/instancia/status")
async def status(
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    """Verifica status da conexão."""
    result = await db.execute(
        select(WhatsappInstancia).where(
            WhatsappInstancia.empresa_id == usuario.empresa_id,
            WhatsappInstancia.ativo == True,
        )
    )
    inst = result.scalar_one_or_none()
    if not inst:
        return {"conectado": False, "instancia": None}

    try:
        dados = await status_instancia(inst.nome_instancia)
        conectado = dados.get("instance", {}).get("state") == "open"
        if conectado != inst.conectado:
            inst.conectado = conectado
            await db.flush()
        return {
            "conectado": conectado,
            "instancia": inst.nome_instancia,
            "numero": inst.numero,
            "estado": dados.get("instance", {}).get("state"),
        }
    except Exception:
        return {"conectado": False, "instancia": inst.nome_instancia, "numero": inst.numero}


@router.delete("/instancia/desconectar")
async def desconectar(
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    """Desconecta e remove a instância."""
    inst = await _get_instancia(db, usuario.empresa_id)
    try:
        await deletar_instancia(inst.nome_instancia)
    except Exception as e:
        logger.warning(f"[WA] Erro ao deletar instância: {e}")
    inst.ativo = False
    inst.conectado = False
    await db.flush()
    return {"mensagem": "WhatsApp desconectado com sucesso."}


@router.post("/enviar")
async def enviar(
    payload: dict,
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    """Envia mensagem manual para um número."""
    numero   = payload.get("numero", "")
    mensagem = payload.get("mensagem", "")
    if not numero or not mensagem:
        raise HTTPException(400, "numero e mensagem são obrigatórios")

    inst = await _get_instancia(db, usuario.empresa_id)
    if not inst.conectado:
        raise HTTPException(400, "WhatsApp não está conectado. Escaneie o QR Code primeiro.")

    result = await enviar_texto(inst.nome_instancia, numero, mensagem)
    return {"enviado": True, "resultado": result}


# ── Webhook — recebe mensagens da Evolution API ───────────────────────────────

@router.post("/webhook")
async def webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Recebe eventos da Evolution API.
    Identifica a empresa pelo nome da instância e processa com a Orbita.
    """
    try:
        body = await request.json()
    except Exception:
        return {"status": "invalid_json"}

    event = body.get("event", "")
    logger.info(f"[WA Webhook] evento={event}")

    # Só processa mensagens recebidas (ignora mensagens enviadas pelo bot)
    if event != "messages.upsert":
        return {"status": "ignored", "event": event}

    data = body.get("data", {})
    key  = data.get("key", {})

    # Ignora mensagens enviadas pelo próprio número
    if key.get("fromMe"):
        return {"status": "ignored", "reason": "fromMe"}

    instance_name = body.get("instance", "")
    message_id    = key.get("id", "")

    # Deduplicação — evita processar a mesma mensagem duas vezes
    if message_id and message_id in _mensagens_processadas:
        return {"status": "duplicate"}
    if message_id:
        _mensagens_processadas.add(message_id)
        if len(_mensagens_processadas) > 1000:
            _mensagens_processadas.clear()

    # Extrai texto
    msg_content = data.get("message", {})
    texto = (
        msg_content.get("conversation") or
        msg_content.get("extendedTextMessage", {}).get("text") or
        ""
    ).strip()

    numero_remetente = key.get("remoteJid", "").replace("@s.whatsapp.net", "")

    if not texto:
        return {"status": "no_text"}

    logger.info(f"[WA] Mensagem de {numero_remetente} via {instance_name}: {texto[:50]}")

    # Identifica empresa pelo nome da instância
    result = await db.execute(
        select(WhatsappInstancia).where(
            WhatsappInstancia.nome_instancia == instance_name,
            WhatsappInstancia.ativo == True,
        )
    )
    inst = result.scalar_one_or_none()
    if not inst:
        logger.warning(f"[WA] Instância {instance_name} não encontrada")
        return {"status": "instance_not_found"}

    # Busca um usuário admin da empresa para usar como contexto
    from app.models.usuario import Usuario
    u_result = await db.execute(
        select(Usuario).where(
            Usuario.empresa_id == inst.empresa_id,
            Usuario.ativo == True,
        ).limit(1)
    )
    usuario = u_result.scalar_one_or_none()
    if not usuario:
        return {"status": "no_user"}

    # Chama o orquestrador da Orbita
    from app.ai.orchestrator import Orchestrator
    from app.models.empresa import Empresa

    empresa = await db.get(Empresa, inst.empresa_id)
    plano = empresa.plano.value if empresa else "trial"

    try:
        orchestrator = Orchestrator(
            db=db,
            empresa_id=inst.empresa_id,
            usuario_id=usuario.id,
            plano=plano,
        )
        resultado = await orchestrator.processar(
            mensagem=texto,
            canal="whatsapp",
        )
        resposta = resultado.get("resposta", "")
    except Exception as e:
        logger.error(f"[WA] Erro no orchestrator: {e}")
        resposta = "Desculpe, ocorreu um erro. Tente novamente."

    # Envia resposta de volta
    if resposta:
        try:
            await enviar_texto(instance_name, numero_remetente, resposta)
        except Exception as e:
            logger.error(f"[WA] Erro ao enviar resposta: {e}")

    return {"status": "processed", "resposta": resposta[:50]}


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_instancia(db: AsyncSession, empresa_id: str) -> WhatsappInstancia:
    result = await db.execute(
        select(WhatsappInstancia).where(
            WhatsappInstancia.empresa_id == empresa_id,
            WhatsappInstancia.ativo == True,
        )
    )
    inst = result.scalar_one_or_none()
    if not inst:
        raise HTTPException(404, "Nenhuma instância WhatsApp encontrada. Crie uma primeiro.")
    return inst

"""
Endpoints WhatsApp — Baileys.
"""
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
import uuid

from app.core.database import get_db
from app.core.config import settings
from app.core.logging import get_logger
from app.api.deps import get_current_usuario
from app.models.whatsapp import WhatsappInstancia
from app.models.wa_mensagem import WaMensagem
from app.models.usuario import Usuario
from app.models.empresa import Empresa
from app.ai.orchestrator import Orchestrator
from app.services.whatsapp_service import (
    criar_instancia, obter_qrcode, status_instancia,
    configurar_webhook, deletar_instancia, enviar_texto,
)

router = APIRouter()
logger = get_logger("whatsapp")

_mensagens_processadas: set[str] = set()


# ── Gerenciamento de instâncias ───────────────────────────────────────────────

@router.post("/instancia/criar")
async def criar(
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    """Cria uma instância WhatsApp para a empresa."""
    nome = f"orbita_{usuario.empresa_id[:8]}"

    # Verifica se já tem instância ativa no banco
    result = await db.execute(
        select(WhatsappInstancia).where(
            WhatsappInstancia.empresa_id == usuario.empresa_id,
            WhatsappInstancia.ativo == True,
        )
    )
    existente = result.scalar_one_or_none()

    # Se existe no banco, verifica se ainda está no Baileys
    if existente:
        try:
            status_atual = await status_instancia(existente.nome_instancia)
            if status_atual.get("conectado") or status_atual.get("instancia"):
                # Sincroniza status
                existente.conectado = status_atual.get("conectado", False)
                if status_atual.get("numero"):
                    existente.numero = status_atual["numero"]
                await db.flush()
                return {
                    "instancia": existente.nome_instancia,
                    "mensagem": "Instância já existe. Use o botão Ver QR Code para conectar." if not existente.conectado else "WhatsApp já conectado.",
                    "dados": status_atual,
                }
        except Exception:
            pass
        # Baileys reiniciou e perdeu a sessão — marca como inativa e recria
        existente.ativo = False
        await db.flush()

    try:
        dados = await criar_instancia(nome)
        logger.info(f"[WA] Instância criada: {nome}")
    except Exception as e:
        raise HTTPException(503, f"Servidor WhatsApp indisponível: {e}")

    # Configura webhook
    webhook_url = f"{settings.BACKEND_URL}/api/v1/whatsapp/webhook"
    try:
        await configurar_webhook(nome, webhook_url)
    except Exception as e:
        logger.warning(f"[WA] Webhook não configurado: {e}")

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
    """Retorna o QR Code do servidor Baileys."""
    inst = await _get_instancia(db, usuario.empresa_id)

    try:
        dados = await obter_qrcode(inst.nome_instancia)
        # Baileys retorna: {"qrcode": "data:image/png;base64,..."}
        # ou {"conectado": true} se já estiver conectado
        if dados.get("conectado"):
            return {"conectado": True}

        qr = dados.get("qrcode") or dados.get("base64")
        if qr:
            return {"base64": qr}

        return {"base64": None, "mensagem": dados.get("mensagem", "QR ainda sendo gerado. Aguarde 3 segundos.")}

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
        # Baileys retorna: {"conectado": bool, "numero": str, "instancia": str}
        conectado = dados.get("conectado", False)
        if conectado != inst.conectado:
            inst.conectado = conectado
            if dados.get("numero"):
                inst.numero = dados.get("numero")
            await db.flush()
        return {
            "conectado": conectado,
            "instancia": inst.nome_instancia,
            "numero": inst.numero or dados.get("numero"),
            "estado": "open" if conectado else "close",
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


@router.get("/configuracoes")
async def get_configuracoes(
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    """Retorna configurações do WhatsApp da empresa."""
    result = await db.execute(
        select(WhatsappInstancia).where(
            WhatsappInstancia.empresa_id == usuario.empresa_id,
            WhatsappInstancia.ativo == True,
        )
    )
    inst = result.scalar_one_or_none()
    if not inst:
        return {
            "tem_instancia": False,
            "ativo_atendimento": True,
            "responder_grupos": False,
            "mensagem_boas_vindas": "Olá! Sou a Orbita, assistente da empresa. Como posso ajudar?",
            "mensagem_fora_horario": "No momento estamos fora do horário de atendimento. Retornaremos em breve!",
            "horario_inicio": "08:00",
            "horario_fim": "18:00",
            "dias_atendimento": [1, 2, 3, 4, 5],
            "prompt_personalizado": "",
        }
    return {
        "tem_instancia": True,
        "conectado": inst.conectado,
        "numero": inst.numero,
        "ativo_atendimento": inst.ativo_atendimento,
        "responder_grupos": inst.responder_grupos,
        "mensagem_boas_vindas": inst.mensagem_boas_vindas or "Olá! Sou a Orbita, assistente da empresa. Como posso ajudar?",
        "mensagem_fora_horario": inst.mensagem_fora_horario or "No momento estamos fora do horário de atendimento. Retornaremos em breve!",
        "horario_inicio": inst.horario_inicio or "08:00",
        "horario_fim": inst.horario_fim or "18:00",
        "dias_atendimento": inst.dias_atendimento or [1, 2, 3, 4, 5],
        "prompt_personalizado": inst.prompt_personalizado or "",
    }


@router.patch("/configuracoes")
async def salvar_configuracoes(
    payload: dict,
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    """Salva configurações do WhatsApp."""
    inst = await _get_instancia(db, usuario.empresa_id)

    campos = [
        "ativo_atendimento", "responder_grupos", "mensagem_boas_vindas",
        "mensagem_fora_horario", "horario_inicio", "horario_fim",
        "dias_atendimento", "prompt_personalizado",
    ]
    for campo in campos:
        if campo in payload:
            setattr(inst, campo, payload[campo])

    await db.flush()
    return {"mensagem": "Configurações salvas com sucesso!"}


@router.post("/previa-atendimento")
async def previa_atendimento(
    payload: dict,
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    """Gera prévia de como a Orbita responderia um cliente."""
    mensagem = payload.get("mensagem", "Oi! Gostaria de saber sobre os produtos")
    from app.ai.agents.whatsapp_agent import WhatsappAgent
    agente = WhatsappAgent(db=db, empresa_id=usuario.empresa_id)
    result = await agente.executar(
        mensagem=mensagem, historico=[], numero_cliente="preview",
        nome_cliente="Cliente Teste", instancia_config=None,
    )
    seg = agente._empresa.segmento if agente._empresa else None
    return {"resposta": result.get("resposta", ""), "segmento": seg}
async def previa_atendimento(
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
    Recebe eventos do servidor Baileys.
    Atualiza status no banco e processa mensagens com a Orbita.
    """
    try:
        body = await request.json()
    except Exception:
        return {"status": "invalid_json"}

    event = body.get("event", "")
    logger.info(f"[WA Webhook] evento={event}")

    # ── Atualiza status de conexão no banco ───────────────────────────────────
    if event == "CONNECTION_UPDATE":
        status_wa  = body.get("status", "")
        numero     = body.get("numero")
        instancia  = body.get("instancia") or body.get("instance", "")

        if instancia:
            result = await db.execute(
                select(WhatsappInstancia).where(
                    WhatsappInstancia.nome_instancia == instancia,
                    WhatsappInstancia.ativo == True,
                )
            )
            inst = result.scalar_one_or_none()
            if inst:
                inst.conectado = (status_wa == "open")
                if numero:
                    inst.numero = numero
                await db.flush()
                logger.info(f"[WA] Status atualizado: {instancia} → {status_wa}")

        return {"status": "connection_updated"}

    # ── QR Code atualizado (ignora — só loga) ────────────────────────────────
    if event == "QRCODE_UPDATED":
        logger.info(f"[WA] Novo QR Code gerado")
        return {"status": "qr_updated"}

    # ── Mensagens recebidas ───────────────────────────────────────────────────
    if event != "messages.upsert":
        return {"status": "ignored", "event": event}

    data     = body.get("data", {})
    key      = data.get("key", {})
    instance_name = body.get("instance", "")

    if key.get("fromMe"):
        return {"status": "ignored", "reason": "fromMe"}

    message_id = key.get("id", "")

    # Deduplicação
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

    numero_remetente = key.get("remoteJid", "")

    # Normaliza o número remetente:
    # @s.whatsapp.net → remove sufixo, fica só dígitos
    # @lid → mantém como está (linked device, Baileys resolve internamente)
    # @g.us → grupo (já filtrado acima)
    if numero_remetente.endswith("@s.whatsapp.net"):
        numero_display = numero_remetente.replace("@s.whatsapp.net", "")
    else:
        numero_display = numero_remetente  # mantém @lid ou outro formato

    # Ignora grupos (@g.us) e status
    if "@g.us" in numero_remetente or numero_remetente == "status@broadcast":
        return {"status": "ignored", "reason": "group_or_broadcast"}

    if not texto:
        return {"status": "no_text"}

    logger.info(f"[WA] Mensagem de {numero_remetente} via {instance_name}: {texto[:50]}")

    # ── Salva mensagem recebida no banco ──────────────────────────────────────
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

    # Salva a mensagem recebida
    nome_push = data.get("pushName") or data.get("notifyName") or numero_display
    nova_msg = WaMensagem(
        id=str(uuid.uuid4()),
        empresa_id=inst.empresa_id,
        numero=numero_display,
        nome_contato=nome_push,
        mensagem_id=message_id,
        texto=texto,
        direcao="recebida",
        lida=False,
    )
    db.add(nova_msg)
    await db.flush()

    # Busca usuário admin da empresa
    u_result = await db.execute(
        select(Usuario).where(
            Usuario.empresa_id == inst.empresa_id,
            Usuario.ativo == True,
        ).limit(1)
    )
    usuario = u_result.scalar_one_or_none()
    if not usuario:
        return {"status": "no_user"}

    # ── Usa agente específico de WhatsApp (bot de atendimento ao cliente) ────
    empresa = await db.get(Empresa, inst.empresa_id)
    plano = empresa.plano.value if empresa else "trial"

    # Verifica budget
    from app.ai.llm_budget import verificar_e_incrementar
    budget = await verificar_e_incrementar(empresa_id=inst.empresa_id, plano=plano, tokens_estimados=500)
    if not budget["ok"]:
        await enviar_texto(instance_name, numero_remetente, f"⚠️ {budget['motivo']}")
        return {"status": "budget_exceeded"}

    # Usa o WhatsAppAgent — bot de atendimento
    from app.ai.agents.whatsapp_agent import WhatsappAgent
    from app.ai.memory import ConversationMemory
    from app.services.venda_whatsapp_service import processar_pedido

    # Memória da conversa separada por número do cliente
    memory = ConversationMemory(db=db, empresa_id=inst.empresa_id)
    conversa_id = await memory.get_or_create_conversa(
        conversa_id=None,
        canal="whatsapp",
        usuario_id=usuario.id,
    )
    historico = await memory.get_historico(conversa_id=conversa_id, limite=10)

    agente = WhatsappAgent(db=db, empresa_id=inst.empresa_id)
    resultado = await agente.executar(
        mensagem=texto,
        historico=historico,
        numero_cliente=numero_display,
        nome_cliente=nome_push if nome_push != numero_display else None,
        instancia_config=inst,
    )

    resposta = resultado.get("resposta", "")

    # Salva no histórico
    await memory.salvar_mensagem(conversa_id, "user", texto)
    await memory.salvar_mensagem(conversa_id, "assistant", resposta)

    # Se pedido foi confirmado, lança no painel
    pedido = resultado.get("pedido")
    if pedido:
        try:
            pedido["cliente_nome"] = nome_push or numero_display
            pedido["cliente_numero"] = numero_display
            lançamento = await processar_pedido(db=db, empresa_id=inst.empresa_id, pedido=pedido)
            logger.info(f"[WA] Pedido lançado no painel: {lançamento}")
        except Exception as e:
            logger.error(f"[WA] Erro ao lançar pedido: {e}")

    # Envia resposta usando JID completo (suporta @lid e @s.whatsapp.net)
    if resposta:
        try:
            await enviar_texto(instance_name, numero_remetente, resposta)
            logger.info(f"[WA] Resposta enviada para {numero_display}: {resposta[:40]}")

            msg_enviada = WaMensagem(
                id=str(uuid.uuid4()),
                empresa_id=inst.empresa_id,
                numero=numero_display,
                nome_contato=nome_push,
                texto=resposta,
                direcao="enviada",
                lida=True,
            )
            db.add(msg_enviada)
            await db.flush()
        except Exception as e:
            logger.error(f"[WA] Erro ao enviar resposta: {e}")

    return {"status": "processed", "resposta": resposta[:50]}


# ── Caixa de entrada ─────────────────────────────────────────────────────────

@router.get("/conversas")
async def listar_conversas(
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    """Lista todas as conversas (agrupadas por número), com última mensagem."""
    # Subconsulta: última mensagem por número
    sub = (
        select(
            WaMensagem.numero,
            func.max(WaMensagem.criado_em).label("ultima_vez"),
        )
        .where(WaMensagem.empresa_id == usuario.empresa_id)
        .group_by(WaMensagem.numero)
        .subquery()
    )

    result = await db.execute(
        select(WaMensagem)
        .join(sub, (WaMensagem.numero == sub.c.numero) & (WaMensagem.criado_em == sub.c.ultima_vez))
        .where(WaMensagem.empresa_id == usuario.empresa_id)
        .order_by(WaMensagem.criado_em.desc())
        .limit(100)
    )
    msgs = result.scalars().all()

    # Conta não lidas por número
    nao_lidas_result = await db.execute(
        select(WaMensagem.numero, func.count().label("total"))
        .where(WaMensagem.empresa_id == usuario.empresa_id, WaMensagem.lida == False, WaMensagem.direcao == "recebida")
        .group_by(WaMensagem.numero)
    )
    nao_lidas = {row.numero: row.total for row in nao_lidas_result}

    return {
        "conversas": [
            {
                "numero": m.numero,
                "nome_contato": m.nome_contato or m.numero,
                "ultima_mensagem": m.texto[:80],
                "ultima_vez": m.criado_em.isoformat(),
                "direcao": m.direcao,
                "nao_lidas": nao_lidas.get(m.numero, 0),
            }
            for m in msgs
        ]
    }


@router.get("/conversas/{numero}/mensagens")
async def mensagens_conversa(
    numero: str,
    pagina: int = 1,
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    """Retorna histórico de mensagens de uma conversa."""
    limit = 50
    offset = (pagina - 1) * limit

    result = await db.execute(
        select(WaMensagem)
        .where(WaMensagem.empresa_id == usuario.empresa_id, WaMensagem.numero == numero)
        .order_by(WaMensagem.criado_em.asc())
        .offset(offset)
        .limit(limit)
    )
    msgs = result.scalars().all()

    # Marca como lidas
    await db.execute(
        WaMensagem.__table__.update()
        .where(
            WaMensagem.empresa_id == usuario.empresa_id,
            WaMensagem.numero == numero,
            WaMensagem.direcao == "recebida",
            WaMensagem.lida == False,
        )
        .values(lida=True)
    )
    await db.flush()

    return {
        "numero": numero,
        "mensagens": [
            {
                "id": m.id,
                "texto": m.texto,
                "direcao": m.direcao,
                "lida": m.lida,
                "criado_em": m.criado_em.isoformat(),
            }
            for m in msgs
        ],
    }


@router.post("/conversas/{numero}/enviar")
async def enviar_para_numero(
    numero: str,
    payload: dict,
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    """Envia mensagem manual para um número a partir do dashboard."""
    texto = payload.get("texto", "").strip()
    if not texto:
        raise HTTPException(400, "Texto é obrigatório")

    inst = await _get_instancia(db, usuario.empresa_id)
    if not inst.conectado:
        raise HTTPException(400, "WhatsApp não está conectado")

    try:
        await enviar_texto(inst.nome_instancia, numero, texto)
    except Exception as e:
        raise HTTPException(503, f"Erro ao enviar mensagem: {e}")

    # Salva no banco
    msg = WaMensagem(
        id=str(uuid.uuid4()),
        empresa_id=usuario.empresa_id,
        numero=numero,
        texto=texto,
        direcao="enviada",
        lida=True,
    )
    db.add(msg)
    await db.flush()

    return {"enviado": True, "texto": texto}


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

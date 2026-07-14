"""
Orquestrador principal dos agentes de IA.
Fluxo: Router → Agente → Executor (valida empresa_id) → Banco
"""
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agents.router_agent import RouterAgent
from app.ai.agents.financeiro_agent import FinanceiroAgent
from app.ai.agents.estoque_agent import EstoqueAgent
from app.ai.agents.clientes_agent import ClientesAgent
from app.ai.agents.geral_agent import GeralAgent
from app.ai.memory import ConversationMemory
from app.ai.executor import ExecutorSeguro
from app.ai.llm_budget import verificar_e_incrementar
from app.core.logging import get_logger

logger = get_logger("orchestrator")


class Orchestrator:
    def __init__(self, db: AsyncSession, empresa_id: str, usuario_id: str, plano: str = "trial"):
        self.db = db
        self.empresa_id = empresa_id
        self.usuario_id = usuario_id
        self.plano = plano
        self.memory = ConversationMemory(db=db, empresa_id=empresa_id)
        self.executor = ExecutorSeguro(db=db, empresa_id=empresa_id, usuario_id=usuario_id)

        self.agents = {
            "financeiro": FinanceiroAgent(db=db, empresa_id=empresa_id),
            "estoque":    EstoqueAgent(db=db, empresa_id=empresa_id),
            "clientes":   ClientesAgent(db=db, empresa_id=empresa_id),
            "geral":      GeralAgent(db=db, empresa_id=empresa_id),
        }
        self.router = RouterAgent()

    async def processar(
        self,
        mensagem: str,
        conversa_id: str | None = None,
        canal: str = "web",
        confirmado: bool = False,
        acao_pendente: dict | None = None,
        ip: str | None = None,
        request_id: str | None = None,
    ) -> dict[str, Any]:

        # 1. Verifica budget de tokens
        budget = await verificar_e_incrementar(
            empresa_id=self.empresa_id,
            plano=self.plano,
            tokens_estimados=600,
        )
        if not budget["ok"]:
            return {
                "conversa_id": conversa_id or "",
                "resposta": f"⚠️ {budget['motivo']}",
                "acao_executada": None,
                "dados": None,
            }

        # 2. Recupera ou cria conversa
        conversa_id = await self.memory.get_or_create_conversa(
            conversa_id=conversa_id,
            canal=canal,
            usuario_id=self.usuario_id,
        )

        # 3. Histórico (Redis → DB → Summary)
        historico = await self.memory.get_historico(conversa_id=conversa_id)

        # 4. Se há ação pendente de confirmação, executa direto
        if confirmado and acao_pendente:
            try:
                exec_result = await self.executor.executar(
                    acao=acao_pendente["acao"],
                    dados=acao_pendente["dados"],
                    ip=ip,
                    request_id=request_id,
                    confirmado=True,
                )
                resposta = f"✅ {exec_result.get('resultado', 'Ação executada com sucesso.')}"
                await self.memory.salvar_mensagem(conversa_id, "user", mensagem)
                await self.memory.salvar_mensagem(conversa_id, "assistant", resposta)
                return {
                    "conversa_id": conversa_id,
                    "resposta": resposta,
                    "acao_executada": acao_pendente["acao"],
                    "dados": exec_result.get("resultado"),
                }
            except Exception as e:
                resposta = f"❌ Erro ao executar: {str(e)}"
                await self.memory.salvar_mensagem(conversa_id, "user", mensagem)
                await self.memory.salvar_mensagem(conversa_id, "assistant", resposta)
                return {"conversa_id": conversa_id, "resposta": resposta, "acao_executada": None, "dados": None}

        try:
            # 5. Router identifica intenção
            intencao = await self.router.identificar_intencao(
                mensagem=mensagem,
                historico=historico,
            )
            logger.info(f"[Orchestrator] intencao={intencao} empresa={self.empresa_id}")

            # 6. Agente gera resposta + proposta de ação
            nome_agente = intencao.get("agente", "geral")
            agente = self.agents.get(nome_agente, self.agents["geral"])
            resultado = await agente.executar(
                mensagem=mensagem,
                intencao=intencao,
                historico=historico,
            )

            # 7. Se agente propôs ação, passa pelo Executor
            acao_proposta = resultado.get("acao_proposta")
            if acao_proposta:
                exec_result = await self.executor.executar(
                    acao=acao_proposta["tipo"],
                    dados=acao_proposta.get("dados", {}),
                    ip=ip,
                    request_id=request_id,
                    confirmado=False,
                )
                if exec_result.get("requer_confirmacao"):
                    # Retorna para o frontend pedir confirmação
                    await self.memory.salvar_mensagem(conversa_id, "user", mensagem)
                    await self.memory.salvar_mensagem(conversa_id, "assistant", exec_result["resumo"])
                    return {
                        "conversa_id": conversa_id,
                        "resposta": exec_result["resumo"],
                        "requer_confirmacao": True,
                        "acao_pendente": exec_result,
                        "acao_executada": None,
                        "dados": None,
                    }
                resultado["acao_executada"] = acao_proposta["tipo"]
                resultado["dados"] = exec_result.get("resultado")

        except Exception as e:
            erro = str(e).lower()
            logger.error(f"[Orchestrator] Erro empresa={self.empresa_id}: {e}")

            if "api_key" in erro or "authentication" in erro or "401" in erro:
                resposta = "⚠️ Chave do Groq inválida. Verifique `GROQ_API_KEY` no `backend/.env`."
            elif "quota" in erro or "429" in erro or "rate" in erro:
                resposta = "⚠️ Limite de requisições atingido. Aguarde alguns segundos."
            else:
                resposta = "Ocorreu um erro interno. Tente novamente."

            resultado = {"resposta": resposta, "acao_executada": None, "dados": None}

        # 8. Salva histórico
        await self.memory.salvar_mensagem(conversa_id, "user", mensagem)
        await self.memory.salvar_mensagem(conversa_id, "assistant", resultado["resposta"])

        return {
            "conversa_id": conversa_id,
            **resultado,
        }

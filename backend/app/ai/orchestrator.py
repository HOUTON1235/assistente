"""
Orquestrador principal dos agentes de IA.
"""
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agents.router_agent import RouterAgent
from app.ai.agents.financeiro_agent import FinanceiroAgent
from app.ai.agents.estoque_agent import EstoqueAgent
from app.ai.agents.clientes_agent import ClientesAgent
from app.ai.agents.geral_agent import GeralAgent
from app.ai.memory import ConversationMemory


class Orchestrator:
    def __init__(self, db: AsyncSession, empresa_id: str, usuario_id: str):
        self.db = db
        self.empresa_id = empresa_id
        self.usuario_id = usuario_id
        self.memory = ConversationMemory(db=db, empresa_id=empresa_id)

        self.agents = {
            "financeiro": FinanceiroAgent(db=db, empresa_id=empresa_id),
            "estoque": EstoqueAgent(db=db, empresa_id=empresa_id),
            "clientes": ClientesAgent(db=db, empresa_id=empresa_id),
            "geral": GeralAgent(db=db, empresa_id=empresa_id),
        }

        self.router = RouterAgent()

    async def processar(
        self,
        mensagem: str,
        conversa_id: str | None = None,
        canal: str = "web",
    ) -> dict[str, Any]:

        # 1. Recuperar ou criar conversa
        conversa_id = await self.memory.get_or_create_conversa(
            conversa_id=conversa_id,
            canal=canal,
            usuario_id=self.usuario_id,
        )

        # 2. Buscar histórico
        historico = await self.memory.get_historico(conversa_id=conversa_id, limite=10)

        try:
            # 3. Identificar intenção
            intencao = await self.router.identificar_intencao(
                mensagem=mensagem,
                historico=historico,
            )
            print(f"[Orchestrator] Intenção: {intencao}")

            # 4. Acionar agente
            nome_agente = intencao.get("agente", "geral")
            agente = self.agents.get(nome_agente, self.agents["geral"])
            resultado = await agente.executar(
                mensagem=mensagem,
                intencao=intencao,
                historico=historico,
            )

        except Exception as e:
            erro = str(e).lower()
            print(f"[Orchestrator] Erro: {e}")
            if "api_key" in erro or "authentication" in erro or "invalid" in erro or "401" in erro:
                resultado = {
                    "resposta": "⚠️ Chave do Groq inválida ou não configurada. Verifique o `GROQ_API_KEY` no `backend/.env`.",
                    "acao_executada": None,
                    "dados": None,
                }
            elif "quota" in erro or "429" in erro or "rate" in erro:
                resultado = {
                    "resposta": "⚠️ Limite de requisições atingido. Aguarde alguns segundos e tente novamente.",
                    "acao_executada": None,
                    "dados": None,
                }
            else:
                resultado = {
                    "resposta": "Ocorreu um erro interno. Tente novamente.",
                    "acao_executada": None,
                    "dados": None,
                }

        # 5. Salvar no histórico
        await self.memory.salvar_mensagem(conversa_id=conversa_id, role="user", conteudo=mensagem)
        await self.memory.salvar_mensagem(conversa_id=conversa_id, role="assistant", conteudo=resultado["resposta"])

        return {
            "conversa_id": conversa_id,
            **resultado,
        }

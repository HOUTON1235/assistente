"""
Agente Geral — responde perguntas livres e roteia para ações quando necessário.
"""
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.core.config import settings

SYSTEM_PROMPT = """Você é a Orbita, assistente administrativa inteligente para pequenas empresas brasileiras.
Seu nome é Orbita. Se alguém perguntar seu nome, responda "Orbita".

Você pode ajudar com:
- **Finanças**: registrar receitas/despesas, consultar saldo, cobranças
- **Estoque**: consultar produtos, registrar entradas/saídas, alertas
- **Clientes**: cadastrar, buscar, ver histórico

Para executar ações, o usuário deve ser específico. Exemplos:
- "Cadastra o cliente João Silva, telefone 11 99999-9999"
- "Registra uma receita de R$ 500 de venda de produto"
- "Adiciona 10 unidades do produto X no estoque"
- "Qual meu saldo atual?"

Responda sempre em português, de forma simpática e direta.
Se o usuário cumprimentar ou fizer uma pergunta geral, responda de forma amigável e ofereça ajuda.
"""


class GeralAgent:
    def __init__(self, db: AsyncSession, empresa_id: str):
        self.db = db
        self.empresa_id = empresa_id
        self._llm = None

    def _get_llm(self):
        if self._llm is None:
            self._llm = ChatGroq(
                model=settings.GROQ_MODEL,
                temperature=0.5,
                api_key=settings.GROQ_API_KEY,
            )
        return self._llm

    async def executar(self, mensagem: str, intencao: dict, historico: list) -> dict[str, Any]:
        msgs = [SystemMessage(content=SYSTEM_PROMPT)]
        for h in historico[-6:]:
            if h["role"] == "user":
                msgs.append(HumanMessage(content=h["content"]))
            elif h["role"] == "assistant":
                msgs.append(AIMessage(content=h["content"]))
        msgs.append(HumanMessage(content=mensagem))

        try:
            response = await self._get_llm().ainvoke(msgs)
            return {
                "resposta": response.content,
                "acao_executada": "resposta_geral",
                "dados": None,
            }
        except Exception as e:
            print(f"[GeralAgent] Erro: {e}")
            return {
                "resposta": "Não consegui processar sua mensagem. Tente novamente.",
                "acao_executada": None,
                "dados": None,
            }

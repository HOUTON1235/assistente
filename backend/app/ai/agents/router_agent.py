"""
Router Agent — identifica a intenção da mensagem e decide qual agente acionar.
"""
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
import json
import re

from app.core.config import settings

SYSTEM_PROMPT = """Você é um roteador de intenções para um sistema administrativo empresarial.

Analise a mensagem do usuário e retorne um JSON com:
- agente: "financeiro" | "estoque" | "clientes" | "geral"
- acao: descrição curta da ação
- entidades: dicionário com entidades extraídas (valores, nomes, datas, etc.)
- confianca: número de 0 a 1

Exemplos:
- "Quanto entrou esse mês?" → {"agente":"financeiro","acao":"consultar_receitas","entidades":{},"confianca":0.95}
- "Adiciona 10 unidades do produto X" → {"agente":"estoque","acao":"entrada_estoque","entidades":{"produto":"X","quantidade":10},"confianca":0.95}
- "Cadastra o cliente João Silva" → {"agente":"clientes","acao":"criar_cliente","entidades":{"nome":"João Silva"},"confianca":0.95}
- "Quais contas estão vencidas?" → {"agente":"financeiro","acao":"listar_vencidas","entidades":{},"confianca":0.95}
- "Estoque baixo de algum produto?" → {"agente":"estoque","acao":"alertas_estoque","entidades":{},"confianca":0.95}
- "Oi", "Olá", "Me ajuda" → {"agente":"geral","acao":"saudacao","entidades":{},"confianca":1.0}

Retorne APENAS o JSON válido, sem texto adicional, sem markdown.
"""


class RouterAgent:
    def __init__(self):
        self._llm = None

    def _get_llm(self):
        if self._llm is None:
            self._llm = ChatGroq(
                model=settings.GROQ_MODEL,
                temperature=0,
                api_key=settings.GROQ_API_KEY,
            )
        return self._llm

    async def identificar_intencao(self, mensagem: str, historico: list) -> dict:
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=mensagem),
        ]

        try:
            response = await self._get_llm().ainvoke(messages)
            content = response.content.strip()
            content = re.sub(r"```(?:json)?\s*", "", content).strip().rstrip("```").strip()
            resultado = json.loads(content)
            return resultado
        except Exception as e:
            print(f"[RouterAgent] Erro: {e}")
            return {
                "agente": "geral",
                "acao": "resposta_generica",
                "entidades": {},
                "confianca": 0.0,
            }

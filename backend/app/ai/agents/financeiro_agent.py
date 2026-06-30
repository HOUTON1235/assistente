"""
Agente Financeiro — executa ações reais no banco via LLM + tools.
"""
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any
import json

from app.core.config import settings
from app.ai.tools.financeiro_tools import (
    criar_transacao,
    marcar_pago,
    resumo_financeiro,
    listar_transacoes_recentes,
    cancelar_transacao,
    editar_transacao,
)

SYSTEM_PROMPT = """Você é o assistente financeiro de uma pequena empresa brasileira.

Você tem acesso a ferramentas para:
- Consultar resumo financeiro (saldo, receitas, despesas)
- Registrar receitas e despesas
- Marcar contas como pagas
- Listar transações recentes

Use as ferramentas quando o usuário pedir ações financeiras.
Responda em português, de forma direta e clara.
Use R$ para valores monetários.
Após executar uma ação, confirme o que foi feito.
"""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "resumo_financeiro",
            "description": "Consulta o resumo financeiro: saldo, receitas pagas, despesas pagas, contas pendentes e vencidas",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "criar_transacao",
            "description": "Registra uma receita ou despesa. Use para lançar vendas, pagamentos, despesas, cobranças.",
            "parameters": {
                "type": "object",
                "properties": {
                    "tipo": {"type": "string", "enum": ["receita", "despesa"], "description": "receita para entradas, despesa para saídas"},
                    "descricao": {"type": "string", "description": "Descrição da transação"},
                    "valor": {"type": "number", "description": "Valor em reais"},
                    "categoria": {"type": "string", "description": "vendas, servicos, aluguel, salarios, fornecedores, impostos, outros"},
                    "cliente_nome": {"type": "string", "description": "Nome do cliente (opcional)"},
                    "data_vencimento": {"type": "string", "description": "Data no formato YYYY-MM-DD (opcional)"},
                },
                "required": ["tipo", "descricao", "valor"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "marcar_pago",
            "description": "Marca uma transação pendente como paga",
            "parameters": {
                "type": "object",
                "properties": {
                    "descricao_busca": {"type": "string", "description": "Trecho da descrição da transação a marcar como paga"},
                },
                "required": ["descricao_busca"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "listar_transacoes",
            "description": "Lista as transações recentes da empresa",
            "parameters": {
                "type": "object",
                "properties": {
                    "tipo": {"type": "string", "description": "receita ou despesa (opcional)"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "editar_transacao",
            "description": "Edita descrição, valor ou categoria de uma transação existente",
            "parameters": {
                "type": "object",
                "properties": {
                    "descricao_busca": {"type": "string", "description": "Trecho da descrição para localizar a transação"},
                    "nova_descricao": {"type": "string", "description": "Nova descrição (opcional)"},
                    "novo_valor": {"type": "number", "description": "Novo valor em reais (opcional)"},
                    "nova_categoria": {"type": "string", "description": "Nova categoria (opcional)"},
                },
                "required": ["descricao_busca"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "cancelar_transacao",
            "description": "Cancela uma transação pendente",
            "parameters": {
                "type": "object",
                "properties": {
                    "descricao_busca": {"type": "string", "description": "Trecho da descrição da transação a cancelar"},
                },
                "required": ["descricao_busca"],
            },
        },
    },
]


class FinanceiroAgent:
    def __init__(self, db: AsyncSession, empresa_id: str):
        self.db = db
        self.empresa_id = empresa_id
        self._llm = None

    def _get_llm(self):
        if self._llm is None:
            self._llm = ChatGroq(
                model=settings.GROQ_MODEL,
                temperature=0,
                api_key=settings.GROQ_API_KEY,
            ).bind_tools(TOOLS)
        return self._llm

    async def _executar_tool(self, name: str, args: dict) -> str:
        try:
            if name == "resumo_financeiro":
                r = await resumo_financeiro(self.db, self.empresa_id)
                return json.dumps(r, ensure_ascii=False)
            elif name == "criar_transacao":
                r = await criar_transacao(self.db, self.empresa_id, **args)
                return json.dumps(r, ensure_ascii=False)
            elif name == "marcar_pago":
                r = await marcar_pago(self.db, self.empresa_id, **args)
                return json.dumps(r, ensure_ascii=False)
            elif name == "listar_transacoes":
                r = await listar_transacoes_recentes(self.db, self.empresa_id, args.get("tipo"))
                return json.dumps(r, ensure_ascii=False)
            elif name == "editar_transacao":
                r = await editar_transacao(self.db, self.empresa_id, **args)
                return json.dumps(r, ensure_ascii=False)
            elif name == "cancelar_transacao":
                r = await cancelar_transacao(self.db, self.empresa_id, **args)
                return json.dumps(r, ensure_ascii=False)
            return json.dumps({"erro": "ferramenta desconhecida"})
        except Exception as e:
            return json.dumps({"erro": str(e)})

    async def executar(self, mensagem: str, intencao: dict, historico: list) -> dict[str, Any]:
        msgs = [SystemMessage(content=SYSTEM_PROMPT)]
        for h in historico[-6:]:
            if h["role"] == "user":
                msgs.append(HumanMessage(content=h["content"]))
            elif h["role"] == "assistant":
                msgs.append(AIMessage(content=h["content"]))
        msgs.append(HumanMessage(content=mensagem))

        response = await self._get_llm().ainvoke(msgs)

        # Processar tool calls
        if response.tool_calls:
            tool_results = []
            acoes = []
            for tc in response.tool_calls:
                resultado = await self._executar_tool(tc["name"], tc["args"])
                tool_results.append(ToolMessage(content=resultado, tool_call_id=tc["id"]))
                acoes.append(tc["name"])

            # Segunda chamada com resultados das tools
            msgs.append(response)
            msgs.extend(tool_results)
            final = await self._get_llm().ainvoke(msgs)

            return {
                "resposta": final.content,
                "acao_executada": ", ".join(acoes),
                "dados": None,
            }

        return {
            "resposta": response.content,
            "acao_executada": None,
            "dados": None,
        }

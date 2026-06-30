"""
Agente de Clientes — executa ações reais via LLM + tools.
"""
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any
import json

from app.core.config import settings
from app.ai.tools.clientes_tools import (
    criar_cliente,
    buscar_cliente,
    historico_cliente,
    listar_clientes,
    editar_cliente,
    excluir_cliente,
)

SYSTEM_PROMPT = """Você é o assistente de relacionamento com clientes de uma pequena empresa brasileira.

Você pode:
- Cadastrar novos clientes
- Buscar clientes por nome, telefone ou email
- Consultar histórico e dívidas de um cliente
- Listar todos os clientes

Responda em português, de forma simpática e direta.
Sempre confirme quando cadastrar um cliente.
Se encontrar dívidas pendentes ao consultar um cliente, mencione claramente.
"""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "criar_cliente",
            "description": "Cadastra um novo cliente na base",
            "parameters": {
                "type": "object",
                "properties": {
                    "nome": {"type": "string", "description": "Nome completo do cliente"},
                    "telefone": {"type": "string", "description": "Telefone com DDD (opcional)"},
                    "email": {"type": "string", "description": "Email do cliente (opcional)"},
                    "cpf_cnpj": {"type": "string", "description": "CPF ou CNPJ (opcional)"},
                    "observacoes": {"type": "string", "description": "Observações adicionais (opcional)"},
                },
                "required": ["nome"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "buscar_cliente",
            "description": "Busca clientes por nome, telefone ou email",
            "parameters": {
                "type": "object",
                "properties": {
                    "busca": {"type": "string", "description": "Nome, telefone ou email para buscar"},
                },
                "required": ["busca"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "historico_cliente",
            "description": "Consulta histórico financeiro e dívidas de um cliente específico",
            "parameters": {
                "type": "object",
                "properties": {
                    "nome_cliente": {"type": "string", "description": "Nome do cliente"},
                },
                "required": ["nome_cliente"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "listar_clientes",
            "description": "Lista todos os clientes cadastrados",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "editar_cliente",
            "description": "Edita dados de um cliente: nome, telefone, email, CPF/CNPJ",
            "parameters": {
                "type": "object",
                "properties": {
                    "nome_cliente": {"type": "string", "description": "Nome atual do cliente"},
                    "novo_nome": {"type": "string", "description": "Novo nome (opcional)"},
                    "telefone": {"type": "string", "description": "Novo telefone (opcional)"},
                    "email": {"type": "string", "description": "Novo email (opcional)"},
                    "cpf_cnpj": {"type": "string", "description": "CPF ou CNPJ (opcional)"},
                    "observacoes": {"type": "string", "description": "Observações (opcional)"},
                },
                "required": ["nome_cliente"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "excluir_cliente",
            "description": "Remove um cliente da base",
            "parameters": {
                "type": "object",
                "properties": {
                    "nome_cliente": {"type": "string", "description": "Nome do cliente a remover"},
                },
                "required": ["nome_cliente"],
            },
        },
    },
]


class ClientesAgent:
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
            if name == "criar_cliente":
                r = await criar_cliente(self.db, self.empresa_id, **args)
                return json.dumps(r, ensure_ascii=False)
            elif name == "buscar_cliente":
                r = await buscar_cliente(self.db, self.empresa_id, **args)
                return json.dumps(r, ensure_ascii=False)
            elif name == "historico_cliente":
                r = await historico_cliente(self.db, self.empresa_id, **args)
                return json.dumps(r, ensure_ascii=False)
            elif name == "listar_clientes":
                r = await listar_clientes(self.db, self.empresa_id)
                return json.dumps(r, ensure_ascii=False)
            elif name == "editar_cliente":
                r = await editar_cliente(self.db, self.empresa_id, **args)
                return json.dumps(r, ensure_ascii=False)
            elif name == "excluir_cliente":
                r = await excluir_cliente(self.db, self.empresa_id, **args)
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

        if response.tool_calls:
            tool_results = []
            acoes = []
            for tc in response.tool_calls:
                resultado = await self._executar_tool(tc["name"], tc["args"])
                tool_results.append(ToolMessage(content=resultado, tool_call_id=tc["id"]))
                acoes.append(tc["name"])

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

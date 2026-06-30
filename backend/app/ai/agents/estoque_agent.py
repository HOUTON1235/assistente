"""
Agente de Estoque — executa ações reais via LLM + tools.
"""
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any
import json

from app.core.config import settings
from app.ai.tools.estoque_tools import (
    criar_produto,
    movimentar_estoque,
    consultar_estoque,
    alertas_estoque,
    editar_produto,
    excluir_produto,
)

SYSTEM_PROMPT = """Você é o assistente de estoque de uma pequena empresa brasileira.

Você pode:
- Consultar quantidades em estoque
- Registrar entradas e saídas de produtos
- Cadastrar novos produtos
- Alertar sobre estoque baixo

Responda em português, de forma direta.
Sempre confirme o que foi feito após executar uma ação.
Se o estoque ficar baixo após uma movimentação, alerte o usuário.
"""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "consultar_estoque",
            "description": "Consulta o estoque de produtos. Pode buscar um produto específico ou listar todos.",
            "parameters": {
                "type": "object",
                "properties": {
                    "nome_produto": {"type": "string", "description": "Nome ou parte do nome do produto (opcional)"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "alertas_estoque",
            "description": "Lista produtos com estoque abaixo do mínimo",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "movimentar_estoque",
            "description": "Registra entrada, saída ou ajuste de estoque de um produto",
            "parameters": {
                "type": "object",
                "properties": {
                    "nome_produto": {"type": "string", "description": "Nome do produto"},
                    "tipo": {"type": "string", "description": "entrada, saida ou ajuste"},
                    "quantidade": {"type": "integer", "description": "Quantidade a movimentar"},
                    "motivo": {"type": "string", "description": "Motivo da movimentação (opcional)"},
                },
                "required": ["nome_produto", "tipo", "quantidade"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "criar_produto",
            "description": "Cadastra um novo produto no estoque",
            "parameters": {
                "type": "object",
                "properties": {
                    "nome": {"type": "string", "description": "Nome do produto"},
                    "preco_venda": {"type": "number", "description": "Preço de venda"},
                    "quantidade": {"type": "integer", "description": "Quantidade inicial"},
                    "quantidade_minima": {"type": "integer", "description": "Estoque mínimo para alerta"},
                    "unidade": {"type": "string", "description": "Unidade: un, kg, l, cx, etc"},
                    "preco_custo": {"type": "number", "description": "Preço de custo (opcional)"},
                },
                "required": ["nome", "preco_venda"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "editar_produto",
            "description": "Edita dados de um produto existente: nome, preço, estoque mínimo, unidade",
            "parameters": {
                "type": "object",
                "properties": {
                    "nome_produto": {"type": "string", "description": "Nome atual do produto"},
                    "novo_nome": {"type": "string", "description": "Novo nome (opcional)"},
                    "preco_venda": {"type": "number", "description": "Novo preço de venda (opcional)"},
                    "preco_custo": {"type": "number", "description": "Novo preço de custo (opcional)"},
                    "quantidade_minima": {"type": "integer", "description": "Novo estoque mínimo (opcional)"},
                    "unidade": {"type": "string", "description": "Nova unidade (opcional)"},
                },
                "required": ["nome_produto"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "excluir_produto",
            "description": "Remove/desativa um produto do estoque",
            "parameters": {
                "type": "object",
                "properties": {
                    "nome_produto": {"type": "string", "description": "Nome do produto a remover"},
                },
                "required": ["nome_produto"],
            },
        },
    },
]


class EstoqueAgent:
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
            if name == "consultar_estoque":
                r = await consultar_estoque(self.db, self.empresa_id, args.get("nome_produto"))
                return json.dumps(r, ensure_ascii=False)
            elif name == "alertas_estoque":
                r = await alertas_estoque(self.db, self.empresa_id)
                return json.dumps(r, ensure_ascii=False)
            elif name == "movimentar_estoque":
                r = await movimentar_estoque(self.db, self.empresa_id, **args)
                return json.dumps(r, ensure_ascii=False)
            elif name == "criar_produto":
                r = await criar_produto(self.db, self.empresa_id, **args)
                return json.dumps(r, ensure_ascii=False)
            elif name == "editar_produto":
                r = await editar_produto(self.db, self.empresa_id, **args)
                return json.dumps(r, ensure_ascii=False)
            elif name == "excluir_produto":
                r = await excluir_produto(self.db, self.empresa_id, **args)
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

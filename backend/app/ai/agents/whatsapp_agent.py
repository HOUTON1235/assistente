"""
Agente de Atendimento WhatsApp — bot adaptável por segmento de empresa.

Fluxo completo:
  1. Saudação e apresentação da empresa
  2. Apresentação de produtos/serviços
  3. Montagem do pedido (carrinho)
  4. Confirmação do pedido
  5. Registro automático no painel
"""
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Any

from app.core.config import settings
from app.core.logging import get_logger
from app.ai.contexto_empresa import gerar_system_prompt

logger = get_logger("whatsapp_agent")


class WhatsappAgent:
    def __init__(self, db: AsyncSession, empresa_id: str):
        self.db = db
        self.empresa_id = empresa_id
        self._llm = None
        self._empresa = None
        self._produtos = None
        self._carregado = False

    def _get_llm(self):
        if self._llm is None:
            self._llm = ChatGroq(
                model=settings.GROQ_MODEL,
                temperature=0.5,
                api_key=settings.GROQ_API_KEY,
                max_tokens=1024,
            )
        return self._llm

    async def _carregar_contexto(self, instancia_config=None):
        """Carrega dados da empresa e produtos."""
        if self._carregado:
            return

        from app.models.empresa import Empresa
        from app.models.estoque import Produto

        self._empresa = await self.db.get(Empresa, self.empresa_id)

        result = await self.db.execute(
            select(Produto).where(
                Produto.empresa_id == self.empresa_id,
                Produto.ativo == True,
            ).order_by(Produto.preco_venda.asc()).limit(20)
        )
        prods = result.scalars().all()
        self._produtos = [
            {
                "nome": p.nome,
                "preco_venda": float(p.preco_venda),
                "descricao": p.descricao or "",
                "quantidade": p.quantidade,
                "unidade": p.unidade,
            }
            for p in prods if p.quantidade > 0 or p.quantidade == 0
        ]
        self._system_prompt = gerar_system_prompt(
            empresa=self._empresa,
            produtos=self._produtos,
            instancia_config=instancia_config,
        )
        self._carregado = True

    async def executar(
        self,
        mensagem: str,
        historico: list,
        numero_cliente: str,
        nome_cliente: str | None = None,
        instancia_config=None,
    ) -> dict[str, Any]:

        await self._carregar_contexto(instancia_config)

        # Monta histórico para o LLM (últimas 10 trocas)
        msgs = [SystemMessage(content=self._system_prompt)]
        for h in historico[-10:]:
            content = h["content"]
            # Remove marcadores técnicos do histórico
            if "##PEDIDO_CONFIRMADO##" in content:
                content = content.split("##PEDIDO_CONFIRMADO##")[0].strip()
            if h["role"] == "user":
                msgs.append(HumanMessage(content=content))
            elif h["role"] == "assistant":
                msgs.append(AIMessage(content=content))

        msgs.append(HumanMessage(content=mensagem))

        try:
            response = await self._get_llm().ainvoke(msgs)
            resposta_completa = response.content

            # Verifica se pedido foi confirmado
            pedido = None
            if "##PEDIDO_CONFIRMADO##" in resposta_completa:
                partes = resposta_completa.split("##PEDIDO_CONFIRMADO##")
                resposta_limpa = partes[0].strip()
                dados_raw = partes[1].strip() if len(partes) > 1 else ""
                pedido = self._parse_pedido(dados_raw, numero_cliente, nome_cliente)
                logger.info(f"[WA Agent] Pedido confirmado: {pedido}")
            else:
                resposta_limpa = resposta_completa

            return {
                "resposta": resposta_limpa,
                "pedido": pedido,
                "empresa": self._empresa,
                "acao_executada": "pedido_confirmado" if pedido else "atendimento",
                "dados": pedido,
            }

        except Exception as e:
            logger.error(f"[WhatsappAgent] Erro: {e}")
            return {
                "resposta": "Desculpe, tive um probleminha aqui. Pode repetir seu pedido?",
                "pedido": None,
                "empresa": self._empresa,
                "acao_executada": None,
                "dados": None,
            }

    def _parse_pedido(self, raw: str, numero: str, nome: str | None) -> dict:
        """Extrai dados do pedido do texto do LLM."""
        pedido = {
            "itens": [],
            "valor_total": 0.0,
            "cliente_nome": nome or numero,
            "cliente_numero": numero,
            "observacoes": "",
        }
        for linha in raw.split("\n"):
            linha = linha.strip()
            if linha.startswith("itens:"):
                itens_str = linha.replace("itens:", "").strip()
                pedido["itens"] = [i.strip() for i in itens_str.split(",") if i.strip()]
            elif linha.startswith("valor_total:"):
                try:
                    val = linha.replace("valor_total:", "").strip()
                    val = val.replace("R$","").replace(",",".").strip()
                    pedido["valor_total"] = float(val)
                except Exception:
                    pass
            elif linha.startswith("cliente_nome:"):
                n = linha.replace("cliente_nome:", "").strip()
                if n and n.lower() not in ["none", "não informado", ""]:
                    pedido["cliente_nome"] = n
            elif linha.startswith("cliente_numero:"):
                n = linha.replace("cliente_numero:", "").strip()
                if n:
                    pedido["cliente_numero"] = n
            elif linha.startswith("observacoes:"):
                pedido["observacoes"] = linha.replace("observacoes:", "").strip()

        # Descrição do pedido
        itens_str = ", ".join(pedido["itens"]) if pedido["itens"] else "Pedido via WhatsApp"
        pedido["descricao"] = itens_str
        return pedido

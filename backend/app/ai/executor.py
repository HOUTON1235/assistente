"""
Camada Executor — IA propõe ações, Executor valida empresa_id e executa.
A IA nunca acessa o banco diretamente. Toda ação passa por aqui.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.core.logging import get_logger
from app.core.audit import registrar_acao

logger = get_logger("executor")

# Limite de valor para pedir confirmação no frontend
LIMITE_VALOR_CONFIRMACAO = 1000.0

# Ações que precisam de confirmação explícita
ACOES_CRITICAS = {"delete_transacao", "delete_cliente", "delete_produto", "update_empresa"}


class ExecutorSeguro:
    """
    Valida que todas as operações pertencem à empresa correta.
    Registra auditoria de tudo que modifica dados.
    Retorna flag `requer_confirmacao` para o frontend mostrar dialog.
    """

    def __init__(self, db: AsyncSession, empresa_id: str, usuario_id: str):
        self.db = db
        self.empresa_id = empresa_id
        self.usuario_id = usuario_id

    async def executar(
        self,
        acao: str,
        dados: dict,
        ip: str | None = None,
        request_id: str | None = None,
        confirmado: bool = False,
    ) -> dict:
        """
        Executa uma ação proposta pela IA.

        Retorna:
          - {"executado": True, "resultado": ...}          — ação executada
          - {"requer_confirmacao": True, "acao": ..., "resumo": ...}  — pede confirmação
        """
        logger.info(f"[Executor] acao={acao} empresa={self.empresa_id} dados={dados}")

        # 1. Garante empresa_id nos dados (IA não pode sobrescrever)
        dados["empresa_id"] = self.empresa_id

        # 2. Ações críticas precisam de confirmação
        if acao in ACOES_CRITICAS and not confirmado:
            return {
                "requer_confirmacao": True,
                "acao": acao,
                "dados": dados,
                "resumo": self._resumo_acao(acao, dados),
            }

        # 3. Transações acima do limite pedem confirmação
        if acao == "create_transacao":
            valor = float(dados.get("valor", 0))
            if valor >= LIMITE_VALOR_CONFIRMACAO and not confirmado:
                return {
                    "requer_confirmacao": True,
                    "acao": acao,
                    "dados": dados,
                    "resumo": f"Registrar {dados.get('tipo', 'transação')} de R$ {valor:,.2f}. Confirmar?",
                }

        # 4. Executa
        try:
            resultado = await self._executar_acao(acao, dados)
        except Exception as e:
            logger.error(f"[Executor] Erro ao executar {acao}: {e}")
            raise

        # 5. Auditoria
        await registrar_acao(
            db=self.db,
            acao=acao,
            recurso=acao.split("_")[-1] if "_" in acao else acao,
            empresa_id=self.empresa_id,
            usuario_id=self.usuario_id,
            recurso_id=resultado.get("id"),
            dados_depois=dados,
            ip=ip,
            request_id=request_id,
        )

        return {"executado": True, "resultado": resultado}

    def _resumo_acao(self, acao: str, dados: dict) -> str:
        resumos = {
            "delete_transacao": f"Excluir transação #{dados.get('id', '')}. Esta ação não pode ser desfeita.",
            "delete_cliente": f"Excluir cliente #{dados.get('id', '')}. Todos os dados serão removidos.",
            "delete_produto": f"Excluir produto #{dados.get('id', '')}.",
            "update_empresa": "Alterar dados da empresa.",
        }
        return resumos.get(acao, f"Executar ação: {acao}")

    async def _executar_acao(self, acao: str, dados: dict) -> dict:
        """Roteador de ações para os services corretos."""
        from app.ai.actions import (
            criar_transacao, deletar_transacao,
            criar_cliente, deletar_cliente,
            criar_produto, deletar_produto,
            registrar_movimentacao,
        )

        handlers = {
            "create_transacao":    criar_transacao,
            "delete_transacao":    deletar_transacao,
            "create_cliente":      criar_cliente,
            "delete_cliente":      deletar_cliente,
            "create_produto":      criar_produto,
            "delete_produto":      deletar_produto,
            "movimentacao_estoque":registrar_movimentacao,
        }

        handler = handlers.get(acao)
        if not handler:
            raise ValueError(f"Ação desconhecida: {acao}")

        return await handler(db=self.db, empresa_id=self.empresa_id, dados=dados)

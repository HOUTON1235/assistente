#!/bin/bash
cd /Users/ifmatimontimon/Documents/assistente/backend
source venv/bin/activate
export PYTHONPATH=/Users/ifmatimontimon/Documents/assistente/backend

python3 - << 'EOF'
import sys
print("Python:", sys.version[:20])

from app.models import Empresa, Usuario, Cliente, Transacao, Produto, AuditLog
print("[OK] models + AuditLog")

from app.models.conversa import Conversa
assert hasattr(Conversa, "summary"), "ERRO: coluna summary não existe em Conversa"
print("[OK] Conversa.summary")

from app.ai.actions import criar_transacao, criar_cliente, criar_produto
print("[OK] ai.actions")

from app.ai.executor import ExecutorSeguro
print("[OK] ai.executor")

from app.ai.llm_budget import get_uso_mes, verificar_e_incrementar
print("[OK] ai.llm_budget")

from app.ai.memory import ConversationMemory
print("[OK] ai.memory")

from app.ai.orchestrator import Orchestrator
print("[OK] ai.orchestrator")

from app.core.logging import RequestLoggingMiddleware, get_logger
print("[OK] core.logging")

from app.core.rate_limiter import login_rate_limit, blacklist_token, is_token_blacklisted
print("[OK] core.rate_limiter")

from app.core.audit import registrar_acao
print("[OK] core.audit")

from app.schemas.chat import ChatRequest, ChatResponse
assert hasattr(ChatRequest, "confirmado"), "ERRO: campo confirmado não existe em ChatRequest"
assert hasattr(ChatResponse, "requer_confirmacao"), "ERRO: campo requer_confirmacao não existe"
print("[OK] schemas.chat com novos campos")

from app.main import app
print("[OK] app FastAPI — rotas:", len(app.routes))

print("")
print("========================================")
print("TUDO OK — backend pronto para produção!")
print("========================================")
EOF

#!/bin/bash
VENV=/Users/ifmatimontimon/Documents/assistente/backend/venv
PIP=$VENV/bin/pip
PYTHON=$VENV/bin/python
export PYTHONPATH=/Users/ifmatimontimon/Documents/assistente/backend

echo "==> Instalando langchain-groq e demais dependencias..."
$PIP install langchain-groq==0.2.3 "pydantic[email]" resend mercadopago apscheduler==3.10.4

echo ""
echo "==> Verificando todos os imports do backend..."
$PYTHON - << 'EOF'
import sys
print("Python:", sys.version[:20])

from app.core.config import settings
print("[OK] config.settings")

from app.core.database import Base, engine
print("[OK] database")

from app.models import Empresa, Usuario, Cliente, Transacao, Produto, Conversa, Mensagem, Assinatura, Admin, Notificacao
print("[OK] models")

from app.schemas.auth import LoginRequest
print("[OK] schemas.auth")

from app.services.email_service import enviar_verificacao_email
print("[OK] email_service")

from app.services.pagamento_service import criar_preferencia_pagamento
print("[OK] pagamento_service")

from app.services.alertas_service import verificar_vencimentos
print("[OK] alertas_service")

from app.services.validacao_service import validar_cnpj
print("[OK] validacao_service")

from app.ai.agents.router_agent import RouterAgent
print("[OK] ai.router_agent")

from app.ai.orchestrator import Orchestrator
print("[OK] ai.orchestrator")

from app.api.v1.router import api_router
print("[OK] router -", len(api_router.routes), "rotas")

from app.main import app
print("[OK] app FastAPI -", app.title)

print("")
print("==============================")
print("BACKEND 100% OK - PRONTO PARA RODAR!")
print("==============================")
EOF

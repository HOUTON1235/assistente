#!/bin/bash
cd /Users/ifmatimontimon/Documents/assistente/backend
source venv/bin/activate
export PYTHONPATH=/Users/ifmatimontimon/Documents/assistente/backend

python3 - << 'EOF'
import importlib, sys

# Força reload de todos os módulos do projeto
for key in list(sys.modules.keys()):
    if key.startswith("app."):
        del sys.modules[key]

from app.schemas.chat import ChatRequest, ChatResponse
print("confirmado" in ChatRequest.model_fields, "requer_confirmacao" in ChatResponse.model_fields)

from app.main import app
print("rotas:", len(app.routes))

from app.models.conversa import Conversa
print("summary:", hasattr(Conversa, "summary"))

print("TUDO OK")
EOF

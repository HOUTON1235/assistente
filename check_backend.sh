#!/bin/bash
export PYTHONPATH=/Users/ifmatimontimon/Documents/assistente/backend

PYTHON=/Users/ifmatimontimon/Documents/assistente/backend/venv/bin/python

echo "==> Verificando imports do backend..."

$PYTHON - << 'EOF'
import sys
print("Python:", sys.version[:20])

from app.core.config import settings
print("Settings OK - DB:", settings.DATABASE_URL[:50])

from app.core.database import Base, engine
print("Database engine OK")

from app.models import Empresa, Usuario, Cliente
print("Models OK")

from app.api.v1.router import api_router
print("Router OK - rotas:", len(api_router.routes))

from app.main import app
print("App OK - title:", app.title)

print("")
print("TODOS OS IMPORTS OK - backend pronto!")
EOF

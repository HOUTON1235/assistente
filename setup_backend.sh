#!/bin/bash
    
PYTHON=/opt/homebrew/Cellar/python@3.12/3.12.13_4/Frameworks/Python.framework/Versions/3.12/bin/python3.12
BACKEND=/Users/ifmatimontimon/Documents/assistente/backend
PIP="$BACKEND/venv/bin/pip"

echo "==> Python version:"
$PYTHON --version

echo ""
echo "==> Criando virtualenv com Python 3.12..."
$PYTHON -m venv "$BACKEND/venv"
echo "virtualenv criado em $BACKEND/venv"

echo ""
echo "==> Atualizando pip..."
"$BACKEND/venv/bin/python" -m pip install --upgrade pip 2>&1

echo ""
echo "==> Instalando requirements.txt..."
"$BACKEND/venv/bin/python" -m pip install -r "$BACKEND/requirements.txt" 2>&1

echo ""
echo "==> Instalando apscheduler..."
"$BACKEND/venv/bin/python" -m pip install "apscheduler==3.10.4" 2>&1

echo ""
echo "==> Verificando pacotes instalados:"
"$BACKEND/venv/bin/python" -m pip list 2>&1 | grep -E "fastapi|uvicorn|sqlalchemy|langchain|apscheduler|redis|asyncpg|pydantic"

echo ""
echo "==> CONCLUIDO!"

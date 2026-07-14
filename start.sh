#!/bin/bash
# Script para iniciar todo o projeto Orbita

export PATH="/opt/homebrew/opt/node@20/bin:/opt/homebrew/opt/postgresql@16/bin:$PATH"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║        ORBITA — Iniciando...         ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 1. PostgreSQL e Redis
echo "→ Iniciando PostgreSQL e Redis..."
/opt/homebrew/bin/brew services start postgresql@16 2>/dev/null
/opt/homebrew/bin/brew services start redis 2>/dev/null
sleep 2

# 2. WhatsApp server (Baileys)
echo "→ Iniciando servidor WhatsApp (porta 8080)..."
BACKEND_WEBHOOK="http://localhost:8000/api/v1/whatsapp/webhook" \
  node /Users/ifmatimontimon/Documents/assistente/whatsapp/server.js &
WA_PID=$!
sleep 3

# 3. Backend FastAPI
echo "→ Iniciando backend FastAPI (porta 8000)..."
cd /Users/ifmatimontimon/Documents/assistente/backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACK_PID=$!
sleep 5

# 4. Frontend Next.js
echo "→ Iniciando frontend Next.js (porta 3000)..."
cd /Users/ifmatimontimon/Documents/assistente/frontend
npm run dev &
FRONT_PID=$!
sleep 3

echo ""
echo "╔══════════════════════════════════════╗"
echo "║          ORBITA — Online!            ║"
echo "╠══════════════════════════════════════╣"
echo "║  Frontend:  http://localhost:3000    ║"
echo "║  Backend:   http://localhost:8000    ║"
echo "║  WhatsApp:  http://localhost:8080    ║"
echo "║  API Docs:  http://localhost:8000/docs║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "  Pressione Ctrl+C para parar tudo"
echo ""

# Aguarda Ctrl+C
trap "echo 'Parando...'; kill $WA_PID $BACK_PID $FRONT_PID 2>/dev/null" SIGINT SIGTERM
wait

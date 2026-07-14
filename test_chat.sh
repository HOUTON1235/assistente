#!/bin/bash
cd /Users/ifmatimontimon/Documents/assistente/backend
source venv/bin/activate
export PYTHONPATH=/Users/ifmatimontimon/Documents/assistente/backend

# Pega token primeiro
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rioscarloseduardo298@gmail.com","senha":"1234567"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token','ERRO'))")

echo "Token: ${TOKEN:0:30}..."

# Testa chat
RESULT=$(curl -s -X POST http://localhost:8000/api/v1/chat/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"mensagem":"oi"}')

echo "Chat response: $RESULT"

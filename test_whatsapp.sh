#!/bin/bash
cd /Users/ifmatimontimon/Documents/assistente/backend
source venv/bin/activate
export PYTHONPATH=/Users/ifmatimontimon/Documents/assistente/backend

# Login
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rioscarloseduardo298@gmail.com","senha":"1234567"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "Token OK: ${TOKEN:0:20}..."

# Limpa instancia antiga
curl -s -X DELETE http://localhost:8000/api/v1/whatsapp/instancia/desconectar \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null

# Cria instancia
echo "==> Criando instancia..."
CRIA=$(curl -s -X POST http://localhost:8000/api/v1/whatsapp/instancia/criar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")
echo "Criado: $(echo $CRIA | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("mensagem",""))')"

# Pega QR Code
echo "==> Buscando QR Code..."
QR=$(curl -s http://localhost:8000/api/v1/whatsapp/instancia/qrcode \
  -H "Authorization: Bearer $TOKEN")
B64=$(echo $QR | python3 -c "import sys,json; d=json.load(sys.stdin); print(str(d.get('base64',''))[:50])")
echo "QR base64: $B64"

if [ -n "$B64" ] && [ "$B64" != "None" ]; then
  echo "==> QR CODE FUNCIONANDO!"
else
  echo "==> SEM QR CODE. Resposta: $(echo $QR | head -c 200)"
fi

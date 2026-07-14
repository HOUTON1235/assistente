#!/bin/bash
KEY="429683C4C977415CAAFCCE10F7D57E11"

echo "==> Listando instancias..."
curl -s http://localhost:8080/instance/fetchInstances -H "apikey: $KEY"
echo ""

echo "==> Criando instancia..."
curl -s -X POST http://localhost:8080/instance/create \
  -H "apikey: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"instanceName":"orbita_d0bddc27","qrcode":true,"integration":"WHATSAPP-BAILEYS"}'
echo ""

echo "==> Pegando QR Code..."
sleep 2
curl -s http://localhost:8080/instance/connect/orbita_d0bddc27 -H "apikey: $KEY" | python3 -c "import sys,json; d=json.load(sys.stdin); print('base64:', str(d.get('base64',''))[:50])"

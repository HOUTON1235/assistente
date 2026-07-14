#!/bin/bash
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"

echo "==> Node version:"
node --version
echo "==> npm version:"
npm --version

echo ""
echo "==> Instalando dependencias do frontend..."
cd /Users/ifmatimontimon/Documents/assistente/frontend
npm install

echo ""
echo "==> node_modules instalado:"
ls node_modules | wc -l
echo "pacotes"

echo ""
echo "SETUP FRONTEND CONCLUIDO!"

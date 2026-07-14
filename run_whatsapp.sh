#!/bin/bash
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
export BACKEND_WEBHOOK="http://localhost:8000/api/v1/whatsapp/webhook"
cd /Users/ifmatimontimon/Documents/assistente/whatsapp
node server.js

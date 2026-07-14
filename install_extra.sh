#!/bin/bash
PIP=/Users/ifmatimontimon/Documents/assistente/backend/venv/bin/pip

echo "==> Instalando modulos extras ausentes..."
$PIP install "pydantic[email]" resend mercadopago apscheduler==3.10.4

echo ""
$PIP list | grep -E "resend|mercadopago|apscheduler|email.validator"
echo "INSTALL EXTRAS CONCLUIDO!"

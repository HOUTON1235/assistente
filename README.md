# 🤖 Sistema Operacional Inteligente para Pequenas Empresas

> Plataforma SaaS baseada em Inteligência Artificial para centralizar, automatizar e otimizar operações administrativas de pequenas empresas brasileiras.

## Visão Geral

Não é um chatbot. É um **operador administrativo inteligente**.

O gestor conversa com o sistema. O sistema trabalha.

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Backend | Python 3.12 + FastAPI |
| IA / Agentes | LangChain + LangGraph |
| Banco de Dados | PostgreSQL 16 |
| Cache / Sessões | Redis 7 |
| Frontend | Next.js 14 (TypeScript) |
| Mensageria | WhatsApp Business API |
| Infra | Docker + Docker Compose |
| Autenticação | JWT + OAuth2 |

## Estrutura do Projeto

```
assistenteIA/
├── backend/          # API FastAPI + Agentes IA
├── frontend/         # Interface Next.js
├── docs/             # Documentação completa
├── infra/            # Docker, configs de infraestrutura
├── scripts/          # Scripts utilitários
└── tests/            # Testes automatizados
```

## Como Rodar

```bash
# Subir os serviços
docker-compose up -d

# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Planos

| Plano | Descrição |
|---|---|
| Starter | MEI e microempresas |
| Professional | Pequenas empresas |
| Business | Empresas em crescimento |
| Enterprise | Personalizado |

## Status

🟡 Em Desenvolvimento — v1.0

# Arquitetura do Sistema

## Visão Geral

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTES                           │
│         Web App    │    WhatsApp    │    API             │
└────────────────────┼────────────────┼────────────────────┘
                     │                │
┌────────────────────▼────────────────▼────────────────────┐
│                   GATEWAY / API                          │
│              FastAPI + JWT Auth                          │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│                   ORQUESTRADOR IA                        │
│                                                          │
│   ┌──────────────┐   ┌───────────────────────────────┐   │
│   │ Router Agent │──▶│  Agentes Especializados        │   │
│   │ (Intenção)   │   │  ┌────────────┐ ┌──────────┐  │   │
│   └──────────────┘   │  │ Financeiro │ │ Estoque  │  │   │
│                       │  └────────────┘ └──────────┘  │   │
│   ┌──────────────┐   │  ┌────────────┐ ┌──────────┐  │   │
│   │   Memória    │   │  │  Clientes  │ │ Docs/NF  │  │   │
│   │ (Histórico)  │   │  └────────────┘ └──────────┘  │   │
│   └──────────────┘   └───────────────────────────────┘   │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│                   CAMADA DE DADOS                        │
│                                                          │
│   PostgreSQL (dados)    Redis (cache/sessões)            │
└──────────────────────────────────────────────────────────┘
```

## Fluxo de uma Mensagem

1. Usuário envia mensagem (web ou WhatsApp)
2. API recebe e autentica o token JWT
3. Orquestrador recupera histórico da conversa (memória)
4. **Router Agent** analisa a mensagem e identifica:
   - Qual agente acionar
   - Qual ação executar
   - Quais entidades extrair (valores, nomes, datas)
5. **Agente especializado** busca dados no PostgreSQL
6. Agente gera resposta contextualizada via LLM
7. Resposta é salva no histórico e retornada ao usuário

## Arquitetura dos Agentes

### Router Agent
- Modelo: GPT-4o com temperatura 0
- Função: classificação de intenção
- Output: JSON estruturado com agente, ação e entidades

### Agentes Especializados
Cada agente tem:
- **System prompt** com contexto do domínio
- **Ferramentas** para acessar o banco de dados
- **LLM** com temperatura 0.3 para respostas naturais

### Memória
- Histórico armazenado no PostgreSQL (tabela `mensagens`)
- Últimas 10 mensagens passadas como contexto
- Sessões identificadas por `conversa_id`

## Stack Tecnológica

| Componente | Tecnologia | Versão |
|---|---|---|
| Backend | FastAPI | 0.115 |
| ORM | SQLAlchemy (async) | 2.0 |
| IA Framework | LangChain | 0.3 |
| LLM | OpenAI GPT-4o | - |
| Banco | PostgreSQL | 16 |
| Cache | Redis | 7 |
| Frontend | Next.js | 14 |
| Estilização | Tailwind CSS | 3.4 |
| Containerização | Docker | - |

## Segurança

- Autenticação via JWT (Bearer Token)
- Isolamento de dados por `empresa_id` em todas as queries
- Senhas com hash bcrypt
- Variáveis sensíveis via `.env`
- CORS configurado para origens permitidas
- HTTPS obrigatório em produção

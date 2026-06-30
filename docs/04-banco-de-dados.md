# Modelo de Banco de Dados

## Diagrama Entidade-Relacionamento

```
empresas
├── id (PK)
├── nome
├── cnpj
├── email
├── plano (starter|professional|business|enterprise)
└── ativo

    ↓ 1:N
usuarios
├── id (PK)
├── empresa_id (FK)
├── nome
├── email
├── senha_hash
└── perfil (admin|gestor|operador|contador)

    ↓ 1:N
clientes
├── id (PK)
├── empresa_id (FK)
├── nome
├── email
├── telefone
├── cpf_cnpj
└── limite_credito

transacoes
├── id (PK)
├── empresa_id (FK)
├── cliente_id (FK, nullable)
├── tipo (receita|despesa)
├── categoria
├── descricao
├── valor
├── status (pendente|pago|vencido|cancelado)
├── data_vencimento
└── data_pagamento

produtos
├── id (PK)
├── empresa_id (FK)
├── nome
├── sku
├── preco_custo
├── preco_venda
├── quantidade
└── quantidade_minima

movimentacoes_estoque
├── id (PK)
├── produto_id (FK)
├── tipo (entrada|saida|ajuste)
└── quantidade

conversas
├── id (PK)
├── empresa_id (FK)
├── usuario_id (FK)
└── canal (web|whatsapp|api)

mensagens
├── id (PK)
├── conversa_id (FK)
├── role (user|assistant|system)
├── conteudo
└── tokens_usados
```

## Índices Recomendados

```sql
-- Performance crítica
CREATE INDEX idx_transacoes_empresa ON transacoes(empresa_id);
CREATE INDEX idx_transacoes_status ON transacoes(empresa_id, status);
CREATE INDEX idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX idx_produtos_empresa ON produtos(empresa_id);
CREATE INDEX idx_mensagens_conversa ON mensagens(conversa_id, criado_em);

-- Buscas por texto
CREATE INDEX idx_clientes_nome ON clientes USING gin(to_tsvector('portuguese', nome));
CREATE INDEX idx_produtos_nome ON produtos USING gin(to_tsvector('portuguese', nome));
```

## Multi-tenancy

Todos os dados são isolados por `empresa_id`. Todas as queries **obrigatoriamente** filtram por `empresa_id`, garantindo que nenhum usuário acesse dados de outra empresa.

Esse isolamento é aplicado na camada de serviço, não apenas na interface.

# Requisitos do Sistema

## Requisitos Funcionais

### RF01 — Autenticação e Acesso
- RF01.1 — O sistema deve permitir cadastro de empresa e usuário administrador
- RF01.2 — O sistema deve autenticar usuários via e-mail e senha
- RF01.3 — O sistema deve emitir token JWT com expiração configurável
- RF01.4 — O sistema deve suportar múltiplos usuários por empresa com perfis (admin, gestor, operador)
- RF01.5 — O sistema deve permitir recuperação de senha via e-mail

### RF02 — Chat com IA
- RF02.1 — O sistema deve receber mensagens em linguagem natural
- RF02.2 — O sistema deve identificar a intenção da mensagem automaticamente
- RF02.3 — O sistema deve executar ações com base nos comandos recebidos
- RF02.4 — O sistema deve manter histórico de conversas por sessão
- RF02.5 — O sistema deve suportar contexto das últimas 10 mensagens
- RF02.6 — O sistema deve responder em português brasileiro
- RF02.7 — O sistema deve suportar canal web e WhatsApp

### RF03 — Gestão Financeira
- RF03.1 — O sistema deve permitir cadastro de receitas e despesas
- RF03.2 — O sistema deve calcular saldo em tempo real
- RF03.3 — O sistema deve listar contas vencidas e a vencer
- RF03.4 — O sistema deve suportar categorização de transações
- RF03.5 — O sistema deve permitir marcação de pagamento
- RF03.6 — O sistema deve gerar resumo financeiro por período
- RF03.7 — O sistema deve suportar transações recorrentes
- RF03.8 — O sistema deve emitir alertas de vencimento

### RF04 — Gestão de Estoque
- RF04.1 — O sistema deve permitir cadastro de produtos
- RF04.2 — O sistema deve registrar entradas e saídas de estoque
- RF04.3 — O sistema deve alertar quando estoque atingir quantidade mínima
- RF04.4 — O sistema deve registrar histórico de movimentações
- RF04.5 — O sistema deve suportar ajuste de inventário
- RF04.6 — O sistema deve calcular valor total em estoque

### RF05 — Gestão de Clientes
- RF05.1 — O sistema deve permitir cadastro completo de clientes
- RF05.2 — O sistema deve suportar busca por nome, e-mail ou documento
- RF05.3 — O sistema deve vincular transações financeiras a clientes
- RF05.4 — O sistema deve manter histórico de interações
- RF05.5 — O sistema deve suportar limite de crédito por cliente

### RF06 — Dashboard
- RF06.1 — O sistema deve exibir resumo financeiro na tela principal
- RF06.2 — O sistema deve exibir alertas ativos (vencimentos, estoque)
- RF06.3 — O sistema deve exibir contadores de clientes e produtos
- RF06.4 — O sistema deve atualizar dados em tempo real

### RF07 — WhatsApp
- RF07.1 — O sistema deve receber mensagens via WhatsApp Business API
- RF07.2 — O sistema deve identificar a empresa pelo número cadastrado
- RF07.3 — O sistema deve processar comandos enviados pelo WhatsApp
- RF07.4 — O sistema deve enviar respostas pelo WhatsApp
- RF07.5 — O sistema deve enviar alertas automáticos de vencimento

---

## Requisitos Não Funcionais

### RNF01 — Desempenho
- Tempo de resposta do chat: < 5 segundos (p95)
- Tempo de resposta das APIs REST: < 500ms (p95)
- Suporte a 1.000 usuários simultâneos no MVP

### RNF02 — Disponibilidade
- SLA de 99,5% de uptime
- Recuperação de falha em até 5 minutos

### RNF03 — Segurança
- Dados isolados por empresa (multi-tenancy)
- Senhas armazenadas com bcrypt
- Tokens JWT com expiração de 24h
- HTTPS obrigatório em produção
- Conformidade com LGPD

### RNF04 — Escalabilidade
- Arquitetura stateless no backend
- Cache Redis para sessões e dados frequentes
- Banco com connection pooling

### RNF05 — Usabilidade
- Interface responsiva (desktop e mobile)
- Onboarding em menos de 3 minutos
- Sem necessidade de treinamento técnico

---

## Regras de Negócio

- RN01: Cada empresa tem dados 100% isolados — nenhum usuário acessa dados de outra empresa
- RN02: O plano Starter limita a 1 usuário e 500 transações/mês
- RN03: Transações vencidas há mais de 3 dias geram alerta automático
- RN04: Produtos com estoque <= quantidade_minima geram alerta de reposição
- RN05: Apenas usuários com perfil admin podem alterar configurações da empresa
- RN06: O histórico de conversas é retido por 90 dias no plano Starter, 1 ano no Professional

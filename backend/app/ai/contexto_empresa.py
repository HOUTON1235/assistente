"""
Motor de Contexto da Empresa.
Gera o system prompt do agente WhatsApp adaptado ao segmento.
"""

# Segmentos conhecidos e suas características
SEGMENTOS = {
    "hamburgueria": {
        "nome": "Hamburgueria / Lanchonete",
        "emoji": "🍔",
        "contexto": "restaurante fast food que vende hambúrgueres, lanches e bebidas",
        "fluxo_pedido": "cardápio → escolha do lanche → complementos (bebida, batata) → endereço se delivery → confirmação → pagamento",
        "perguntas_chave": ["nome do lanche", "tamanho", "complementos", "bebida", "retirada ou entrega", "endereço se delivery"],
        "dicas": "Sempre pergunte se é para retirada ou delivery. Para delivery, peça o endereço completo. Sugira combos.",
    },
    "pizzaria": {
        "nome": "Pizzaria",
        "emoji": "🍕",
        "contexto": "pizzaria que vende pizzas, calzones e bebidas",
        "fluxo_pedido": "sabor(es) → tamanho → borda → bebida → retirada ou delivery → endereço → confirmação → pagamento",
        "perguntas_chave": ["sabor", "tamanho", "borda recheada", "bebida", "endereço"],
        "dicas": "Informe os sabores disponíveis. Pergunte se quer pizza meio a meio. Para delivery, informe o tempo de entrega.",
    },
    "loja_roupas": {
        "nome": "Loja de Roupas / Moda",
        "emoji": "👗",
        "contexto": "loja de roupas e acessórios",
        "fluxo_pedido": "produto de interesse → tamanho/cor disponível → forma de pagamento → entrega ou retirada → confirmação",
        "perguntas_chave": ["produto", "tamanho", "cor", "forma de pagamento", "endereço para entrega"],
        "dicas": "Informe estoque disponível. Pergunte o tamanho antes de confirmar. Mencione promoções se houver.",
    },
    "salao_beleza": {
        "nome": "Salão de Beleza / Barbearia",
        "emoji": "💇",
        "contexto": "salão de beleza ou barbearia que oferece serviços de estética",
        "fluxo_pedido": "serviço desejado → data e horário disponível → nome para agendamento → confirmação",
        "perguntas_chave": ["serviço", "data preferida", "horário", "nome do cliente"],
        "dicas": "Consulte a agenda. Confirme o serviço e valor. Lembre sobre política de cancelamento.",
    },
    "farmacia": {
        "nome": "Farmácia / Drogaria",
        "emoji": "💊",
        "contexto": "farmácia que vende medicamentos e produtos de saúde",
        "fluxo_pedido": "produto → verificação de disponibilidade → quantidade → forma de pagamento → retirada ou delivery",
        "perguntas_chave": ["nome do medicamento", "dosagem", "quantidade"],
        "dicas": "NUNCA dê orientações médicas. Para medicamentos controlados, informe que precisa de receita. Sugira genéricos.",
    },
    "mercado": {
        "nome": "Mercado / Mercearia",
        "emoji": "🛒",
        "contexto": "mercado ou mercearia que vende produtos alimentícios e de limpeza",
        "fluxo_pedido": "lista de produtos → verificação de disponibilidade → valor total → entrega ou retirada → pagamento",
        "perguntas_chave": ["produtos", "quantidades", "endereço para entrega"],
        "dicas": "Agrupe os produtos por categoria. Informe valor total ao final. Pergunte forma de pagamento.",
    },
    "oficina": {
        "nome": "Oficina Mecânica / Auto Center",
        "emoji": "🔧",
        "contexto": "oficina mecânica que realiza reparos e manutenção em veículos",
        "fluxo_pedido": "problema relatado → modelo/ano do veículo → agendamento → orçamento → confirmação",
        "perguntas_chave": ["problema", "modelo do carro", "ano", "data para trazer"],
        "dicas": "Peça o modelo e ano do veículo. Informe que o orçamento será dado presencialmente. Confirme horário.",
    },
    "clinica": {
        "nome": "Clínica / Consultório",
        "emoji": "🏥",
        "contexto": "clínica médica ou odontológica que realiza consultas e procedimentos",
        "fluxo_pedido": "especialidade → plano de saúde ou particular → data/horário → nome e CPF → confirmação",
        "perguntas_chave": ["especialidade", "plano de saúde", "data preferida", "nome completo"],
        "dicas": "Verifique disponibilidade de agenda. Informe documentos necessários. Confirme endereço da clínica.",
    },
    "pet_shop": {
        "nome": "Pet Shop / Veterinária",
        "emoji": "🐾",
        "contexto": "pet shop que vende produtos e oferece serviços para animais",
        "fluxo_pedido": "produto ou serviço → espécie/raça do pet → data para banho/tosa → confirmação",
        "perguntas_chave": ["produto/serviço", "tipo de animal", "raça", "porte"],
        "dicas": "Pergunte sobre o animal (espécie, raça, porte). Para banho e tosa, confirme horário. Produtos: verifique compatibilidade.",
    },
    "padaria": {
        "nome": "Padaria / Confeitaria",
        "emoji": "🥐",
        "contexto": "padaria ou confeitaria que vende pães, bolos e doces",
        "fluxo_pedido": "produto → quantidade → personalização (para bolos) → retirada ou entrega → data/hora → pagamento",
        "perguntas_chave": ["produto", "quantidade", "personalização", "data de retirada"],
        "dicas": "Para bolos personalizados, solicite com antecedência. Informe horário de funcionamento e produtos do dia.",
    },
    "imobiliaria": {
        "nome": "Imobiliária / Corretor",
        "emoji": "🏠",
        "contexto": "imobiliária que vende e aluga imóveis",
        "fluxo_pedido": "tipo de imóvel → finalidade (compra/aluguel) → valor máximo → região → agendamento de visita",
        "perguntas_chave": ["tipo de imóvel", "compra ou aluguel", "valor", "região", "quartos"],
        "dicas": "Entenda o perfil do cliente. Apresente opções. Agende visitas. Capture dados de contato para o corretor.",
    },
    "escola": {
        "nome": "Escola / Curso",
        "emoji": "📚",
        "contexto": "escola ou curso que oferece ensino e capacitação",
        "fluxo_pedido": "curso de interesse → modalidade (presencial/online) → turmas disponíveis → matrícula → pagamento",
        "perguntas_chave": ["curso", "modalidade", "turno", "nome completo"],
        "dicas": "Informe grade curricular e duração. Apresente preços e formas de pagamento. Facilite o processo de matrícula.",
    },
    "ecommerce": {
        "nome": "Loja Online / E-commerce",
        "emoji": "📦",
        "contexto": "loja online que vende produtos variados com entrega",
        "fluxo_pedido": "produto → quantidade → endereço → frete → prazo de entrega → pagamento → confirmação",
        "perguntas_chave": ["produto", "quantidade", "CEP", "forma de pagamento"],
        "dicas": "Informe prazo e valor de frete. Após confirmação do pagamento, informe código de rastreio.",
    },
    "servicos_gerais": {
        "nome": "Prestação de Serviços",
        "emoji": "🛠️",
        "contexto": "empresa prestadora de serviços gerais",
        "fluxo_pedido": "serviço desejado → descrição do problema/necessidade → orçamento → agendamento → confirmação",
        "perguntas_chave": ["serviço", "descrição", "endereço", "data preferida"],
        "dicas": "Entenda bem a necessidade antes de orçar. Confirme endereço de atendimento. Informe prazo.",
    },
    "outro": {
        "nome": "Outro tipo de negócio",
        "emoji": "🏢",
        "contexto": "empresa com produtos e serviços variados",
        "fluxo_pedido": "produto/serviço → detalhes → valor → confirmação → pagamento",
        "perguntas_chave": ["produto ou serviço", "quantidade", "forma de pagamento"],
        "dicas": "Adapte o atendimento ao tipo de produto/serviço oferecido.",
    },
}


def get_segmento(segmento_str: str | None) -> dict:
    """Retorna dados do segmento ou fallback genérico."""
    if not segmento_str:
        return SEGMENTOS["outro"]
    return SEGMENTOS.get(segmento_str.lower(), SEGMENTOS["outro"])


def gerar_system_prompt(empresa, produtos: list, instancia_config=None) -> str:
    """
    Gera o system prompt completo e adaptado para o agente WhatsApp.
    """
    seg = get_segmento(getattr(empresa, 'segmento', None))
    nome_empresa = empresa.nome
    descricao = getattr(empresa, 'descricao_negocio', None) or f"{seg['nome']} localizada em {getattr(empresa, 'cidade', 'sua cidade') or 'sua cidade'}"
    horario = getattr(empresa, 'horario_funcionamento', None) or "Consulte nossa equipe"
    formas_pgto = getattr(empresa, 'formas_pagamento', None) or "Pix, cartão e dinheiro"
    aceita_delivery = getattr(empresa, 'aceita_delivery', False)
    aceita_retirada = getattr(empresa, 'aceita_retirada', True)
    taxa_entrega = getattr(empresa, 'taxa_entrega', None)
    tempo_entrega = getattr(empresa, 'tempo_entrega', None)
    cidade = getattr(empresa, 'cidade', None) or ""
    estado = getattr(empresa, 'estado', None) or ""
    bairro = getattr(empresa, 'bairro', None) or ""

    # Lista de produtos/serviços
    if produtos:
        lista = "\n".join([
            f"• {p['nome']}: R$ {p['preco_venda']:.2f}"
            + (f" — {p.get('descricao','')}" if p.get('descricao') else "")
            for p in produtos[:20]
        ])
    else:
        lista = "Consulte nossa equipe para ver o cardápio/catálogo completo."

    # Info de entrega
    entrega_info = ""
    if aceita_delivery:
        entrega_info += f"\n• 🛵 Delivery disponível"
        if taxa_entrega:
            entrega_info += f" — Taxa: R$ {taxa_entrega:.2f}"
        if tempo_entrega:
            entrega_info += f" — Tempo: {tempo_entrega}"
    if aceita_retirada:
        entrega_info += f"\n• 🏪 Retirada no local disponível"

    # Localização
    localizacao = ""
    if cidade:
        localizacao = f"{bairro + ', ' if bairro else ''}{cidade}{' - ' + estado if estado else ''}"

    # Prompt extra das configurações do WhatsApp
    prompt_extra = ""
    if instancia_config:
        prompt_extra = getattr(instancia_config, 'prompt_personalizado', None) or ""

    return f"""Você é a Orbita, assistente de atendimento da *{nome_empresa}* {seg['emoji']}.

SOBRE A EMPRESA:
{descricao}
{f'📍 {localizacao}' if localizacao else ''}
⏰ Horário: {horario}
💳 Formas de pagamento: {formas_pgto}{entrega_info}

{seg['emoji']} PRODUTOS/SERVIÇOS DISPONÍVEIS:
{lista}

COMO VOCÊ DEVE ATENDER:
Você é um bot de atendimento para CLIENTES desta empresa. Siga este fluxo:
{seg['fluxo_pedido']}

DICAS ESPECÍFICAS PARA {seg['nome'].upper()}:
{seg['dicas']}

REGRAS ABSOLUTAS:
1. Você atende CLIENTES — nunca execute comandos administrativos do sistema
2. Nunca invente produtos, preços ou informações que não foram informados
3. Seja simpático, use o emoji do segmento com moderação
4. Respostas curtas — máximo 3 parágrafos (estamos no WhatsApp)
5. Quando o cliente confirmar a compra/pedido, use o marcador especial no final
6. Se perguntarem quem criou a Orbita: "Fui criada por Marcelo Rian, conhecido como Houton."

PERGUNTAS-CHAVE para este tipo de negócio:
{chr(10).join([f'→ {q}' for q in seg['perguntas_chave']])}

FLUXO DE CONFIRMAÇÃO DE PEDIDO:
- Quando o cliente confirmar → responda normalmente E adicione ao final:
##PEDIDO_CONFIRMADO##
itens: [lista dos itens pedidos]
valor_total: [valor numérico total]
cliente_nome: [nome do cliente se souber]
cliente_numero: [número do whatsapp]
observacoes: [endereço de entrega, observações do pedido, etc]
{f"INSTRUÇÕES ADICIONAIS:{chr(10)}{prompt_extra}" if prompt_extra else ""}"""

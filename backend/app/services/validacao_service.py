"""
Serviço de validação: CNPJ (BrasilAPI), CPF (algoritmo), CEP (ViaCEP).
"""
import httpx
import re


def validar_cpf(cpf: str) -> bool:
    """Valida CPF pelo algoritmo dos dígitos verificadores."""
    cpf = re.sub(r"\D", "", cpf)
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False

    def calc_digito(cpf_parcial: str, peso_inicial: int) -> int:
        soma = sum(int(d) * p for d, p in zip(cpf_parcial, range(peso_inicial, 1, -1)))
        resto = (soma * 10) % 11
        return 0 if resto >= 10 else resto

    d1 = calc_digito(cpf[:9], 10)
    d2 = calc_digito(cpf[:10], 11)
    return cpf[-2:] == f"{d1}{d2}"


async def validar_cnpj(cnpj: str) -> dict:
    """
    Valida e consulta CNPJ na BrasilAPI.
    Retorna dados da empresa se válido.
    """
    cnpj_limpo = re.sub(r"\D", "", cnpj)
    if len(cnpj_limpo) != 14:
        return {"valido": False, "erro": "CNPJ deve ter 14 dígitos"}

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(f"https://brasilapi.com.br/api/cnpj/v1/{cnpj_limpo}")
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "valido": True,
                    "razao_social": data.get("razao_social", ""),
                    "nome_fantasia": data.get("nome_fantasia", ""),
                    "situacao": data.get("descricao_situacao_cadastral", ""),
                    "cnpj": cnpj_limpo,
                }
            return {"valido": False, "erro": "CNPJ não encontrado na Receita Federal"}
        except Exception as e:
            return {"valido": False, "erro": f"Erro ao consultar CNPJ: {str(e)}"}


async def buscar_cep(cep: str) -> dict:
    """
    Busca endereço pelo CEP usando ViaCEP (gratuito).
    """
    cep_limpo = re.sub(r"\D", "", cep)
    if len(cep_limpo) != 8:
        return {"encontrado": False, "erro": "CEP inválido"}

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(f"https://viacep.com.br/ws/{cep_limpo}/json/")
            if resp.status_code == 200:
                data = resp.json()
                if data.get("erro"):
                    return {"encontrado": False, "erro": "CEP não encontrado"}
                return {
                    "encontrado": True,
                    "cep": cep_limpo,
                    "logradouro": data.get("logradouro", ""),
                    "bairro": data.get("bairro", ""),
                    "cidade": data.get("localidade", ""),
                    "estado": data.get("uf", ""),
                }
            return {"encontrado": False, "erro": "Erro ao consultar CEP"}
        except Exception as e:
            return {"encontrado": False, "erro": str(e)}

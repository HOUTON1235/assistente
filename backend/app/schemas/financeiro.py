from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TransacaoCreate(BaseModel):
    tipo: str  # receita | despesa
    categoria: str = "outros"
    descricao: str
    valor: float
    cliente_id: Optional[str] = None
    data_vencimento: Optional[datetime] = None
    recorrente: bool = False
    observacoes: Optional[str] = None


class TransacaoUpdate(BaseModel):
    descricao: Optional[str] = None
    valor: Optional[float] = None
    status: Optional[str] = None
    data_pagamento: Optional[datetime] = None
    observacoes: Optional[str] = None


class TransacaoSchema(BaseModel):
    id: str
    tipo: str
    categoria: str
    descricao: str
    valor: float
    status: str
    data_vencimento: Optional[datetime]
    data_pagamento: Optional[datetime]
    criado_em: datetime

    class Config:
        from_attributes = True


class ResumoFinanceiro(BaseModel):
    total_receitas: float
    total_despesas: float
    saldo: float
    contas_vencidas: int
    contas_a_vencer: int

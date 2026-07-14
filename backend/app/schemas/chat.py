from pydantic import BaseModel
from typing import Any


class ChatRequest(BaseModel):
    mensagem: str
    conversa_id: str | None = None
    canal: str = "web"
    confirmado: bool = False
    acao_pendente: dict | None = None


class ChatResponse(BaseModel):
    resposta: str
    conversa_id: str
    acao_executada: str | None = None
    dados: dict[str, Any] | None = None
    requer_confirmacao: bool = False
    acao_pendente: dict | None = None


class MensagemSchema(BaseModel):
    id: str
    role: str
    conteudo: str
    criado_em: str

    class Config:
        from_attributes = True


class ConversaSchema(BaseModel):
    id: str
    titulo: str | None
    canal: str
    criado_em: str
    mensagens: list[MensagemSchema] = []

    class Config:
        from_attributes = True

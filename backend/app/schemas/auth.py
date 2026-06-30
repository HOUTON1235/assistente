from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario_id: str
    empresa_id: str
    perfil: str


class RegisterRequest(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    empresa_nome: str
    empresa_cnpj: str | None = None

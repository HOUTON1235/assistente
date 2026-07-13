from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash
from app.api.deps import get_current_usuario
from app.models.usuario import Usuario
from app.models.empresa import Empresa

router = APIRouter()


class AtualizarPerfilRequest(BaseModel):
    nome: Optional[str] = None
    telefone: Optional[str] = None


class AlterarSenhaRequest(BaseModel):
    senha_atual: str
    nova_senha: str


class AtualizarEmpresaRequest(BaseModel):
    nome: Optional[str] = None
    telefone: Optional[str] = None
    cep: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None


@router.get("/perfil")
async def obter_perfil(
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    empresa = await db.get(Empresa, usuario.empresa_id)
    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "email": usuario.email,
        "perfil": usuario.perfil.value,
        "email_verificado": usuario.email_verificado,
        "empresa": {
            "id": empresa.id if empresa else None,
            "nome": empresa.nome if empresa else None,
            "cnpj": empresa.cnpj if empresa else None,
            "telefone": empresa.telefone if empresa else None,
            "plano": empresa.plano.value if empresa else None,
            "status": empresa.status.value if empresa else None,
            "trial_dias_restantes": empresa.trial_dias_restantes if empresa else 0,
            "cidade": empresa.cidade if empresa else None,
            "estado": empresa.estado if empresa else None,
            "cep": empresa.cep if empresa else None,
            "logradouro": empresa.logradouro if empresa else None,
            "numero": empresa.numero if empresa else None,
            "bairro": empresa.bairro if empresa else None,
        },
    }


@router.patch("/perfil")
async def atualizar_perfil(
    payload: AtualizarPerfilRequest,
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    if payload.nome:
        usuario.nome = payload.nome
    await db.flush()
    return {"mensagem": "Perfil atualizado"}


@router.patch("/senha")
async def alterar_senha(
    payload: AlterarSenhaRequest,
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(payload.senha_atual, usuario.senha_hash):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")

    if len(payload.nova_senha) < 6:
        raise HTTPException(status_code=400, detail="Nova senha deve ter pelo menos 6 caracteres")

    usuario.senha_hash = get_password_hash(payload.nova_senha)
    await db.flush()
    return {"mensagem": "Senha alterada com sucesso"}


@router.patch("/empresa")
async def atualizar_empresa(
    payload: AtualizarEmpresaRequest,
    usuario=Depends(get_current_usuario),
    db: AsyncSession = Depends(get_db),
):
    if usuario.perfil.value != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem editar a empresa")

    empresa = await db.get(Empresa, usuario.empresa_id)
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    campos = payload.model_dump(exclude_unset=True)
    for campo, valor in campos.items():
        setattr(empresa, campo, valor)

    await db.flush()
    return {"mensagem": "Dados da empresa atualizados"}

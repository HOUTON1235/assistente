from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.usuario import Usuario
from app.models.empresa import Empresa
from app.schemas.auth import LoginRequest, TokenResponse, RegisterRequest

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Usuario).where(Usuario.email == payload.email))
    usuario = result.scalar_one_or_none()

    if not usuario or not verify_password(payload.senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )

    if not usuario.ativo:
        raise HTTPException(status_code=403, detail="Usuário inativo")

    token = create_access_token(subject=usuario.id)

    return TokenResponse(
        access_token=token,
        usuario_id=usuario.id,
        empresa_id=usuario.empresa_id,
        perfil=usuario.perfil.value,
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Verificar se email já existe
    result = await db.execute(select(Usuario).where(Usuario.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    # Criar empresa
    empresa = Empresa(nome=payload.empresa_nome, email=payload.email, cnpj=payload.empresa_cnpj)
    db.add(empresa)
    await db.flush()

    # Criar usuário admin
    usuario = Usuario(
        empresa_id=empresa.id,
        nome=payload.nome,
        email=payload.email,
        senha_hash=get_password_hash(payload.senha),
        perfil="admin",
    )
    db.add(usuario)
    await db.flush()

    token = create_access_token(subject=usuario.id)

    return TokenResponse(
        access_token=token,
        usuario_id=usuario.id,
        empresa_id=empresa.id,
        perfil="admin",
    )

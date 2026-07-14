from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import decode_token
from app.models.usuario import Usuario
from app.models.empresa import Empresa, PlanoEnum, StatusEmpresaEnum
from app.models.admin import Admin

bearer_scheme = HTTPBearer()


async def get_current_usuario(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credentials.credentials
        payload = decode_token(token)
        usuario_id: str = payload.get("sub")
        if not usuario_id or usuario_id.startswith("admin:"):
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Verifica blacklist
    try:
        from app.core.rate_limiter import is_token_blacklisted
        if await is_token_blacklisted(token):
            raise credentials_exception
    except HTTPException:
        raise
    except Exception:
        pass  # Redis offline? Deixa passar

    result = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    usuario = result.scalar_one_or_none()

    if not usuario or not usuario.ativo:
        raise credentials_exception

    # Verifica empresa
    empresa = await db.get(Empresa, usuario.empresa_id)
    if empresa:
        if empresa.plano == PlanoEnum.trial:
            if not empresa.trial_ativo:
                raise HTTPException(
                    status_code=402,
                    detail="Período de trial expirado. Escolha um plano para continuar.",
                )
        elif empresa.status == StatusEmpresaEnum.suspensa:
            raise HTTPException(status_code=403, detail="Conta suspensa. Entre em contato com o suporte.")

    return usuario


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Admin:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Acesso restrito a administradores",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(credentials.credentials)
        sub: str = payload.get("sub", "")
        if not sub.startswith("admin:"):
            raise credentials_exception
        admin_id = sub.replace("admin:", "")
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(Admin).where(Admin.id == admin_id))
    admin = result.scalar_one_or_none()

    if not admin or not admin.ativo:
        raise credentials_exception

    return admin

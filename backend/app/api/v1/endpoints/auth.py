from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, EmailStr
import secrets
import uuid

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.rate_limiter import login_rate_limit, api_rate_limit
from app.core.config import settings
from app.models.usuario import Usuario
from app.models.empresa import Empresa, PlanoEnum, StatusEmpresaEnum
from app.models.assinatura import Assinatura, StatusAssinaturaEnum
from app.services.email_service import (
    enviar_verificacao_email,
    enviar_reset_senha,
    enviar_boas_vindas_trial,
    enviar_codigo_reset,
)
from app.services.validacao_service import validar_cnpj, buscar_cep, validar_cpf

router = APIRouter()


# ── Schemas ──────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario_id: str
    empresa_id: str
    perfil: str
    email_verificado: bool
    plano: str
    trial_dias_restantes: int


class RegisterRequest(BaseModel):
    # Dados pessoais
    nome: str
    email: EmailStr
    senha: str
    # Dados da empresa
    empresa_nome: str
    cnpj: str | None = None
    cpf: str | None = None
    telefone: str | None = None
    cep: str | None = None
    numero: str | None = None
    complemento: str | None = None
    # Segmento e negócio
    segmento: str | None = None
    descricao_negocio: str | None = None
    horario_funcionamento: str | None = None
    formas_pagamento: str | None = None
    aceita_delivery: bool = False
    aceita_retirada: bool = True
    taxa_entrega: float | None = None
    tempo_entrega: str | None = None


class EsqueciSenhaRequest(BaseModel):
    email: EmailStr


class VerificarCodigoRequest(BaseModel):
    email: EmailStr
    codigo: str


class NovaSenhaComCodigoRequest(BaseModel):
    email: EmailStr
    codigo: str
    nova_senha: str


class NovaSenhaRequest(BaseModel):
    token: str
    nova_senha: str


class VerificarEmailRequest(BaseModel):
    token: str


class ConsultarCNPJRequest(BaseModel):
    cnpj: str


class ConsultarCEPRequest(BaseModel):
    cep: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

class GoogleLoginRequest(BaseModel):
    email: EmailStr
    nome: str
    google_id: str
    foto: str | None = None


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    ip = request.client.host if request.client else "unknown"
    await login_rate_limit(email=payload.email, ip=ip)

    result = await db.execute(select(Usuario).where(Usuario.email == payload.email))
    usuario = result.scalar_one_or_none()

    if not usuario or not verify_password(payload.senha, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")

    if not usuario.ativo:
        raise HTTPException(status_code=403, detail="Conta desativada")

    usuario.ultimo_acesso = datetime.now(timezone.utc)
    await db.flush()

    empresa = await db.get(Empresa, usuario.empresa_id)
    token = create_access_token(subject=usuario.id)

    return TokenResponse(
        access_token=token,
        usuario_id=usuario.id,
        empresa_id=usuario.empresa_id,
        perfil=usuario.perfil.value,
        email_verificado=usuario.email_verificado,
        plano=empresa.plano.value if empresa else "trial",
        trial_dias_restantes=empresa.trial_dias_restantes if empresa else 0,
    )


@router.post("/google", response_model=TokenResponse, status_code=200)
async def login_google(
    payload: GoogleLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Login/registro via Google OAuth."""
    # Busca usuário existente
    result = await db.execute(select(Usuario).where(Usuario.email == payload.email))
    usuario = result.scalar_one_or_none()

    if not usuario:
        # Cria empresa e usuário automaticamente
        trial_expira = datetime.now(timezone.utc) + timedelta(days=settings.TRIAL_DIAS)
        empresa = Empresa(
            nome=payload.nome,
            email=payload.email,
            plano=PlanoEnum.trial,
            status=StatusEmpresaEnum.trial,
            trial_expira_em=trial_expira,
            max_usuarios=1,
            max_transacoes_mes=500,
        )
        db.add(empresa)
        await db.flush()

        usuario = Usuario(
            empresa_id=empresa.id,
            nome=payload.nome,
            email=payload.email,
            senha_hash=get_password_hash(secrets.token_urlsafe(32)),
            perfil="admin",
            email_verificado=True,  # Google já verificou
        )
        db.add(usuario)
        await db.flush()

    if not usuario.ativo:
        raise HTTPException(status_code=403, detail="Conta desativada")

    usuario.ultimo_acesso = datetime.now(timezone.utc)
    await db.flush()

    empresa = await db.get(Empresa, usuario.empresa_id)
    token = create_access_token(subject=usuario.id)

    return TokenResponse(
        access_token=token,
        usuario_id=usuario.id,
        empresa_id=usuario.empresa_id,
        perfil=usuario.perfil.value,
        email_verificado=True,
        plano=empresa.plano.value if empresa else "trial",
        trial_dias_restantes=empresa.trial_dias_restantes if empresa else 0,
    )



async def login(payload: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    # Rate limiting: 5 tentativas/email e 20/IP em 5 minutos
    ip = request.client.host if request.client else "unknown"
    await login_rate_limit(email=payload.email, ip=ip)

    result = await db.execute(select(Usuario).where(Usuario.email == payload.email))
    usuario = result.scalar_one_or_none()

    if not usuario or not verify_password(payload.senha, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")

    if not usuario.ativo:
        raise HTTPException(status_code=403, detail="Conta desativada")

    # Atualiza último acesso
    usuario.ultimo_acesso = datetime.now(timezone.utc)
    await db.flush()

    # Busca empresa
    empresa = await db.get(Empresa, usuario.empresa_id)

    token = create_access_token(subject=usuario.id)

    return TokenResponse(
        access_token=token,
        usuario_id=usuario.id,
        empresa_id=usuario.empresa_id,
        perfil=usuario.perfil.value,
        email_verificado=usuario.email_verificado,
        plano=empresa.plano.value if empresa else "trial",
        trial_dias_restantes=empresa.trial_dias_restantes if empresa else 0,
    )


@router.post("/logout")
async def logout(request: Request):
    """Invalida o token adicionando à blacklist no Redis."""
    from app.core.rate_limiter import blacklist_token
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
    from app.core.config import settings
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth.split(" ")[1]
        await blacklist_token(token, expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    return {"mensagem": "Logout realizado com sucesso"}


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(
    payload: RegisterRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    # Rate limit: 5 registros por IP em 10 minutos
    ip = request.client.host if request.client else "unknown"
    await api_rate_limit(empresa_id=f"register:{ip}", endpoint="register", max_req=5, window=600)
    # Verificar email duplicado
    result = await db.execute(select(Usuario).where(Usuario.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    # Validar CPF se fornecido
    if payload.cpf and not validar_cpf(payload.cpf):
        raise HTTPException(status_code=400, detail="CPF inválido")

    # Buscar endereço pelo CEP se fornecido
    endereco = {}
    if payload.cep:
        endereco = await buscar_cep(payload.cep)
        if not endereco.get("encontrado"):
            raise HTTPException(status_code=400, detail="CEP não encontrado")

    # Validar CNPJ se fornecido (não bloqueia — apenas valida formato)
    razao_social = payload.empresa_nome
    if payload.cnpj:
        cnpj_data = await validar_cnpj(payload.cnpj)
        if not cnpj_data.get("valido"):
            raise HTTPException(status_code=400, detail=cnpj_data.get("erro", "CNPJ inválido"))
        if cnpj_data.get("razao_social"):
            razao_social = cnpj_data["razao_social"]

    # Criar empresa com trial de 30 dias
    trial_expira = datetime.now(timezone.utc) + timedelta(days=settings.TRIAL_DIAS)
    empresa = Empresa(
        nome=payload.empresa_nome,
        email=payload.email,
        cnpj=payload.cnpj,
        cpf=payload.cpf,
        telefone=payload.telefone,
        plano=PlanoEnum.trial,
        status=StatusEmpresaEnum.trial,
        trial_expira_em=trial_expira,
        max_usuarios=1,
        max_transacoes_mes=500,
        # Endereço
        cep=endereco.get("cep"),
        logradouro=endereco.get("logradouro"),
        numero=payload.numero,
        complemento=payload.complemento,
        bairro=endereco.get("bairro"),
        cidade=endereco.get("cidade"),
        estado=endereco.get("estado"),
        # Segmento do negócio
        segmento=payload.segmento,
        descricao_negocio=payload.descricao_negocio,
        horario_funcionamento=payload.horario_funcionamento,
        formas_pagamento=payload.formas_pagamento,
        aceita_delivery=payload.aceita_delivery,
        aceita_retirada=payload.aceita_retirada,
        taxa_entrega=payload.taxa_entrega,
        tempo_entrega=payload.tempo_entrega,
    )
    db.add(empresa)
    await db.flush()

    # Criar assinatura trial
    assinatura = Assinatura(
        empresa_id=empresa.id,
        plano="trial",
        status=StatusAssinaturaEnum.trial,
        valor=0,
        expira_em=trial_expira,
    )
    db.add(assinatura)

    # Criar usuário admin — email_verificado=True para não bloquear o login
    # (Email de boas-vindas é enviado como notificação, não como bloqueio)
    token_verificacao = secrets.token_urlsafe(32)
    usuario = Usuario(
        empresa_id=empresa.id,
        nome=payload.nome,
        email=payload.email,
        senha_hash=get_password_hash(payload.senha),
        perfil="admin",
        email_verificado=True,
        email_token_verificacao=token_verificacao,
    )
    db.add(usuario)
    await db.flush()

    # Enviar emails em background
    background_tasks.add_task(
        enviar_verificacao_email, payload.email, payload.nome, token_verificacao
    )
    background_tasks.add_task(
        enviar_boas_vindas_trial, payload.email, payload.nome, payload.empresa_nome
    )

    token = create_access_token(subject=usuario.id)

    return TokenResponse(
        access_token=token,
        usuario_id=usuario.id,
        empresa_id=empresa.id,
        perfil="admin",
        email_verificado=True,
        plano="trial",
        trial_dias_restantes=settings.TRIAL_DIAS,
    )


@router.post("/verificar-email")
async def verificar_email(payload: VerificarEmailRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Usuario).where(Usuario.email_token_verificacao == payload.token)
    )
    usuario = result.scalar_one_or_none()
    if not usuario:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado")

    usuario.email_verificado = True
    usuario.email_token_verificacao = None
    await db.flush()
    return {"mensagem": "Email verificado com sucesso"}


@router.post("/esqueci-senha")
async def esqueci_senha(
    payload: EsqueciSenhaRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Usuario).where(Usuario.email == payload.email))
    usuario = result.scalar_one_or_none()

    if usuario and usuario.ativo:
        codigo = str(secrets.randbelow(900000) + 100000)
        usuario.reset_senha_token = codigo
        usuario.reset_senha_expira = datetime.now(timezone.utc) + timedelta(hours=1)
        await db.flush()

        try:
            enviado = await enviar_codigo_reset(usuario.email, usuario.nome, codigo)
        except Exception as e:
            logger.error(f"[RESET] Exceção ao enviar email: {e}")
            enviado = False

        if not enviado:
            logger.warning(f"[RESET] Email falhou para {usuario.email}. Código: {codigo}")
            return {"mensagem": "Email indisponível no momento.", "codigo": codigo}

    return {"mensagem": "Se o e-mail estiver cadastrado, você receberá um código em breve"}


@router.post("/verificar-codigo")
async def verificar_codigo(
    payload: VerificarCodigoRequest,
    db: AsyncSession = Depends(get_db),
):
    """Verifica se o código de 6 dígitos é válido."""
    result = await db.execute(select(Usuario).where(Usuario.email == payload.email))
    usuario = result.scalar_one_or_none()

    if not usuario or usuario.reset_senha_token != payload.codigo:
        raise HTTPException(status_code=400, detail="Código inválido")

    if usuario.reset_senha_expira < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Código expirado. Solicite um novo.")

    return {"mensagem": "Código válido", "valido": True}


@router.post("/nova-senha-codigo")
async def nova_senha_com_codigo(
    payload: NovaSenhaComCodigoRequest,
    db: AsyncSession = Depends(get_db),
):
    """Redefine a senha usando o código de 6 dígitos."""
    result = await db.execute(select(Usuario).where(Usuario.email == payload.email))
    usuario = result.scalar_one_or_none()

    if not usuario or usuario.reset_senha_token != payload.codigo:
        raise HTTPException(status_code=400, detail="Código inválido")

    if usuario.reset_senha_expira < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Código expirado")

    if len(payload.nova_senha) < 8:
        raise HTTPException(status_code=400, detail="Senha deve ter pelo menos 8 caracteres")

    usuario.senha_hash = get_password_hash(payload.nova_senha)
    usuario.reset_senha_token = None
    usuario.reset_senha_expira = None
    await db.flush()
    return {"mensagem": "Senha alterada com sucesso"}


@router.post("/nova-senha")
async def nova_senha(payload: NovaSenhaRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Usuario).where(Usuario.reset_senha_token == payload.token)
    )
    usuario = result.scalar_one_or_none()

    if not usuario:
        raise HTTPException(status_code=400, detail="Token inválido")

    if usuario.reset_senha_expira < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token expirado. Solicite um novo.")

    if len(payload.nova_senha) < 8:
        raise HTTPException(status_code=400, detail="Senha deve ter pelo menos 8 caracteres")

    usuario.senha_hash = get_password_hash(payload.nova_senha)
    usuario.reset_senha_token = None
    usuario.reset_senha_expira = None
    await db.flush()
    return {"mensagem": "Senha alterada com sucesso"}


@router.post("/consultar-cnpj")
async def consultar_cnpj(payload: ConsultarCNPJRequest):
    """Consulta dados de um CNPJ na Receita Federal via BrasilAPI."""
    return await validar_cnpj(payload.cnpj)


@router.post("/consultar-cep")
async def consultar_cep(payload: ConsultarCEPRequest):
    """Busca endereço por CEP via ViaCEP."""
    return await buscar_cep(payload.cep)


@router.get("/me")
async def me(db: AsyncSession = Depends(get_db), usuario=Depends(lambda: None)):
    """Retorna dados do usuário logado."""
    from app.api.deps import get_current_usuario
    return {"ok": True}

# ===========================================================================
# IMF TURISMO — rotas de autenticação
# POST /api/login (cliente) e POST /api/cadastro (seção 3.3) e
# POST /api/admin/login (rota oculta, seção 3.7).
# São rotas públicas sensíveis: recebem rate limiting (seção 6.5).
# ===========================================================================

from fastapi import APIRouter, Request

from app.config import settings
from app.core.rate_limit import limiter
from app.schemas.auth import LoginAdminRequest, LoginRequest, TokenResponse
from app.schemas.cliente import CadastroCliente
from app.services import auth_service

router = APIRouter(tags=["auth"])


@router.post("/api/login", response_model=TokenResponse)
@limiter.limit(settings.rate_limit_login)
def login(request: Request, dados: LoginRequest):
    """Autentica o cliente por e-mail/senha e retorna o token JWT."""
    return auth_service.login(dados.model_dump())


@router.post("/api/admin/login", response_model=TokenResponse)
@limiter.limit(settings.rate_limit_login)
def login_admin(request: Request, dados: LoginAdminRequest):
    """Autentica o administrador (rota oculta) e retorna o token JWT."""
    return auth_service.login_admin(dados.model_dump())


@router.post("/api/cadastro", status_code=201)
@limiter.limit(settings.rate_limit_cadastro)
def cadastro(request: Request, dados: CadastroCliente):
    """Cria a conta do cliente com a senha hasheada no banco."""
    return auth_service.cadastrar_cliente(dados.model_dump())

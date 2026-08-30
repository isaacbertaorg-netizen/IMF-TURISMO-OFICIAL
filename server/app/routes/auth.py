# ===========================================================================
# IMF TURISMO — rotas de autenticação
# POST /api/login e POST /api/cadastro (seção 3.3 do PRODUCT.md).
# São rotas públicas sensíveis: recebem rate limiting (seção 6.5) para
# prevenir força bruta e spam de cadastros.
# ===========================================================================

from fastapi import APIRouter, Request

from app.config import settings
from app.core.rate_limit import limiter
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.cliente import CadastroCliente
from app.services import auth_service

router = APIRouter(tags=["auth"])


@router.post("/api/login", response_model=TokenResponse)
@limiter.limit(settings.rate_limit_login)
def login(request: Request, dados: LoginRequest):
    """Autentica o usuário no Supabase Auth e retorna o token de acesso."""
    return auth_service.login(dados.model_dump())


@router.post("/api/cadastro", status_code=201)
@limiter.limit(settings.rate_limit_cadastro)
def cadastro(request: Request, dados: CadastroCliente):
    """Cria a conta do cliente: auth.user no Supabase + linha na tabela cliente."""
    return auth_service.cadastrar_cliente(dados.model_dump())

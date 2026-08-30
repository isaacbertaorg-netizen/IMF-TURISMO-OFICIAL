# ===========================================================================
# IMF TURISMO — schemas de autenticação
# Login de cliente (email) e de administrador (login_admin).
# ===========================================================================

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Credenciais de login do cliente."""

    email: EmailStr
    senha: str = Field(min_length=6)


class LoginAdminRequest(BaseModel):
    """Credenciais de login do administrador (rota oculta /admin/login)."""

    login: str = Field(min_length=3, max_length=100)
    senha: str = Field(min_length=6)


class TokenResponse(BaseModel):
    """Resposta do login com o token JWT de sessão."""

    access_token: str
    token_type: str = "bearer"

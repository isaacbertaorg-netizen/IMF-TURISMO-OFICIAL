# ===========================================================================
# IMF TURISMO — schemas de autenticação
# Validação das credenciais de login via Supabase Auth (seção 3.3 do PRODUCT.md).
# ===========================================================================

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Credenciais de login do usuário."""

    email: EmailStr
    senha: str = Field(min_length=6)


class TokenResponse(BaseModel):
    """Resposta do login com o token de acesso gerado pelo Supabase Auth."""

    access_token: str
    token_type: str = "bearer"

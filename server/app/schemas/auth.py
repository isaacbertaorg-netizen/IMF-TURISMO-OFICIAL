# ===========================================================================
# IMF TURISMO — schemas de autenticação
# Login de cliente (email) e de administrador (login_admin).
# ===========================================================================

from pydantic import BaseModel, EmailStr, Field, field_validator


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


class EsqueciSenhaRequest(BaseModel):
    """E-mail que receberá o link de redefinição de senha."""

    email: EmailStr


class RedefinirSenhaRequest(BaseModel):
    """Token recebido por e-mail + a nova senha (confirmada)."""

    token: str = Field(min_length=10)
    senha: str = Field(min_length=6, max_length=72)
    confirmar_senha: str = Field(min_length=6, max_length=72)

    @field_validator("confirmar_senha")
    @classmethod
    def validar_senhas_identicas(cls, valor: str, info):
        """Garante que as senhas coincidam (mesma regra do cadastro)."""
        if "senha" in info.data and valor != info.data["senha"]:
            raise ValueError("As senhas nao coincidem")
        return valor


class MensagemResponse(BaseModel):
    """Resposta simples com uma mensagem para o usuário."""

    mensagem: str

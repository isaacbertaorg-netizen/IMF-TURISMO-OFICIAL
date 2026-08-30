# ===========================================================================
# IMF TURISMO — schemas de cliente
# Validação do cadastro (RF03, seção 3.3 do PRODUCT.md). O cadastro real exige
# nome completo, CPF, e-mail, telefone e endereço — não apenas login/senha.
# ===========================================================================

import re

from pydantic import BaseModel, EmailStr, Field, field_validator


class CadastroCliente(BaseModel):
    """Dados do formulário de criação de conta de cliente."""

    nome: str = Field(min_length=3, max_length=120)
    cpf: str
    email: EmailStr
    telefone: str = Field(min_length=8, max_length=20)
    endereco: str = Field(min_length=5, max_length=255)
    senha: str = Field(min_length=6, max_length=72)
    confirmar_senha: str = Field(min_length=6, max_length=72)

    @field_validator("cpf")
    @classmethod
    def validar_cpf(cls, valor: str) -> str:
        """Normaliza o CPF para apenas dígitos e valida o tamanho.

        A validação completa do CPF (dígitos verificadores) é feita no
        Supabase/banco; aqui garantimos o formato antes de enviar.
        """
        digitos = re.sub(r"\D", "", valor)
        if len(digitos) != 11:
            raise ValueError("CPF deve conter 11 digitos")
        return digitos

    @field_validator("confirmar_senha")
    @classmethod
    def validar_senhas_identicas(cls, valor: str, info):
        """Garante que as senhas coincidam (validação também exigida no back-end)."""
        if "senha" in info.data and valor != info.data["senha"]:
            raise ValueError("As senhas nao coincidem")
        return valor

# ===========================================================================
# IMF TURISMO — schemas de cliente (RF03)
# Formulário de cadastro. Os campos de API são amigáveis (nome, senha); o
# serviço mapeia para as colunas nome_cliente e senha_hash da tabela `cliente`.
# ===========================================================================

import re

from pydantic import BaseModel, EmailStr, Field, field_validator


class CadastroCliente(BaseModel):
    """Dados do formulário de criação de conta de cliente."""

    nome: str = Field(min_length=3, max_length=150)
    cpf: str
    email: EmailStr
    telefone: str = Field(min_length=8, max_length=20)
    endereco: str = Field(min_length=5, max_length=255)
    senha: str = Field(min_length=6, max_length=72)
    confirmar_senha: str = Field(min_length=6, max_length=72)

    @field_validator("cpf")
    @classmethod
    def validar_cpf(cls, valor: str) -> str:
        """Normaliza o CPF para apenas dígitos e valida o tamanho."""
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

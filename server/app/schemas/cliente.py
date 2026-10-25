# ===========================================================================
# IMF TURISMO — schemas de cliente (RF03)
# Formulário de cadastro. Os campos de API são amigáveis (nome, senha); o
# serviço mapeia para as colunas nome_cliente e senha_hash da tabela `cliente`.
# ===========================================================================

import re

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.validacao import cpf_valido, normalizar_cpf


class CadastroCliente(BaseModel):
    """Dados do formulário de criação de conta de cliente."""

    nome: str = Field(min_length=3, max_length=150)
    cpf: str
    email: EmailStr
    telefone: str = Field(min_length=8, max_length=20)
    cep: str
    logradouro: str = Field(min_length=3, max_length=255)
    numero: str = Field(min_length=1, max_length=20)
    complemento: str = Field(default="", max_length=100)
    bairro: str = Field(min_length=2, max_length=150)
    cidade: str = Field(min_length=2, max_length=150)
    uf: str = Field(min_length=2, max_length=2)
    senha: str = Field(min_length=6, max_length=72)
    confirmar_senha: str = Field(min_length=6, max_length=72)
    # O aceite é obrigatório no cadastro: sem ele a conta não é criada.
    aceite_privacidade: bool

    @field_validator("cpf")
    @classmethod
    def validar_cpf(cls, valor: str) -> str:
        """Normaliza o CPF e confere os dígitos verificadores."""
        digitos = normalizar_cpf(valor)
        if len(digitos) != 11:
            raise ValueError("CPF deve conter 11 dígitos")
        if not cpf_valido(digitos):
            raise ValueError("CPF inválido")
        return digitos

    @field_validator("aceite_privacidade")
    @classmethod
    def validar_aceite_privacidade(cls, valor: bool) -> bool:
        """O cadastro só prossegue com o aceite explícito da política."""
        if not valor:
            raise ValueError(
                "É necessário aceitar a Política de Privacidade e os Termos de Uso"
            )
        return valor

    @field_validator("cep")
    @classmethod
    def validar_cep(cls, valor: str) -> str:
        """Normaliza o CEP para apenas dígitos (8 posições)."""
        digitos = re.sub(r"\D", "", valor)
        if len(digitos) != 8:
            raise ValueError("CEP deve conter 8 digitos")
        return digitos

    @field_validator("uf")
    @classmethod
    def validar_uf(cls, valor: str) -> str:
        """UF sempre em maiúsculas (ex.: GO, DF)."""
        return valor.strip().upper()

    @field_validator("confirmar_senha")
    @classmethod
    def validar_senhas_identicas(cls, valor: str, info):
        """Garante que as senhas coincidam (validação também exigida no back-end)."""
        if "senha" in info.data and valor != info.data["senha"]:
            raise ValueError("As senhas nao coincidem")
        return valor


class PerfilUpdate(BaseModel):
    """Edição cadastral do cliente (seção 3.6 do PRODUCT.md).

    CPF e e-mail são chave de identificação e nunca editáveis — por isso nem
    aparecem neste schema (o Pydantic ignora extras, mas a intenção explícita
    é não aceitá-los).
    """

    nome: str | None = Field(default=None, min_length=3, max_length=150)
    telefone: str | None = Field(default=None, min_length=8, max_length=20)
    cep: str | None = None
    logradouro: str | None = Field(default=None, min_length=3, max_length=255)
    numero: str | None = Field(default=None, min_length=1, max_length=20)
    complemento: str | None = Field(default=None, max_length=100)
    bairro: str | None = Field(default=None, min_length=2, max_length=150)
    cidade: str | None = Field(default=None, min_length=2, max_length=150)
    uf: str | None = Field(default=None, min_length=2, max_length=2)

    @field_validator("cep")
    @classmethod
    def validar_cep(cls, valor: str | None) -> str | None:
        """Normaliza o CEP para apenas dígitos quando informado."""
        if valor is None:
            return None
        digitos = re.sub(r"\D", "", valor)
        if len(digitos) != 8:
            raise ValueError("CEP deve conter 8 digitos")
        return digitos

    @field_validator("uf")
    @classmethod
    def validar_uf(cls, valor: str | None) -> str | None:
        """UF sempre em maiúsculas quando informada."""
        if valor is None:
            return None
        return valor.strip().upper()


class ConsentimentosUpdate(BaseModel):
    """Autorizações LGPD editáveis no perfil.

    O aceite da política é obrigatório; as demais autorizações são opcionais
    e podem ser revogadas a qualquer momento (basta enviar `false`).
    """

    aceite_privacidade: bool
    consentimento_imagem: bool = False
    consentimento_marketing: bool = False
    consentimento_compartilhamento: bool = False

# ===========================================================================
# IMF TURISMO — schemas de reserva
# Validação da criação de reservas (RF04, seção 3.4 do PRODUCT.md). Cada vaga
# selecionada exige o cadastro de um passageiro (nome, CPF e data de nascimento).
# ===========================================================================

import re
from datetime import date

from pydantic import BaseModel, Field, field_validator, model_validator


class PassageiroCreate(BaseModel):
    """Dados de um passageiro da reserva (um por vaga)."""

    nome: str = Field(min_length=3, max_length=120)
    cpf: str
    data_nascimento: date

    @field_validator("cpf")
    @classmethod
    def validar_cpf(cls, valor: str) -> str:
        """Normaliza o CPF para apenas dígitos e valida o tamanho."""
        digitos = re.sub(r"\D", "", valor)
        if len(digitos) != 11:
            raise ValueError("CPF deve conter 11 digitos")
        return digitos


class ReservaCreate(BaseModel):
    """Payload de criação de reserva.

    O front-end envia id_excursao, qtd_vagas e a lista de passageiros.
    A quantidade de passageiros deve coincidir com o número de vagas.
    """

    id_excursao: int
    qtd_vagas: int = Field(gt=0)
    passageiros: list[PassageiroCreate] = Field(min_length=1)

    @model_validator(mode="after")
    def validar_qtd_passageiros(self):
        """Garante consistência: cada vaga deve ter exatamente um passageiro."""
        if len(self.passageiros) != self.qtd_vagas:
            raise ValueError("A quantidade de passageiros deve ser igual a qtd_vagas")
        return self

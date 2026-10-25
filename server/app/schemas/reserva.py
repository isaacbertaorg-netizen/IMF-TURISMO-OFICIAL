# ===========================================================================
# IMF TURISMO — schemas de reserva (RF04)
# Nomes alinhados às colunas das tabelas `reserva` e `passageiro`.
# Cada vaga selecionada exige o cadastro de um passageiro.
# ===========================================================================

from datetime import date

from pydantic import BaseModel, Field, field_validator, model_validator

from app.core.validacao import cpf_valido, normalizar_cpf


class PassageiroCreate(BaseModel):
    """Dados de um passageiro da reserva (um por vaga)."""

    nome_passageiro: str = Field(min_length=3, max_length=150)
    cpf: str
    data_nascimento: date

    @field_validator("cpf")
    @classmethod
    def validar_cpf(cls, valor: str) -> str:
        """Normaliza o CPF do passageiro e confere os dígitos verificadores."""
        digitos = normalizar_cpf(valor)
        if len(digitos) != 11:
            raise ValueError("CPF deve conter 11 dígitos")
        if not cpf_valido(digitos):
            raise ValueError("CPF inválido")
        return digitos


class ReservaCreate(BaseModel):
    """Payload de criação de reserva.

    O front-end envia id_excursao, qtd_vagas e a lista de passageiros.
    A quantidade de passageiros deve coincidir com o número de vagas.
    O id_cliente é injetado pelo back-end a partir do token (seção 6.2).
    """

    id_excursao: int
    qtd_vagas: int = Field(gt=0)
    passageiros: list[PassageiroCreate] = Field(min_length=1)
    # Declaração do responsável legal, obrigatória quando há menor de 18
    # anos entre os passageiros na data da excursão.
    declaracao_responsavel_menor: bool = False

    @model_validator(mode="after")
    def validar_qtd_passageiros(self):
        """Garante consistência: cada vaga deve ter exatamente um passageiro."""
        if len(self.passageiros) != self.qtd_vagas:
            raise ValueError("A quantidade de passageiros deve ser igual a qtd_vagas")
        return self


class PassageirosUpdate(BaseModel):
    """Substituição da lista de passageiros de uma reserva existente.

    A quantidade continua vinculada às vagas contratadas (sem alterar o
    estoque), então a lista deve ter exatamente qtd_vagas itens.
    """

    passageiros: list[PassageiroCreate] = Field(min_length=1)
    # A edição pode incluir um menor; nesse caso o responsável precisa
    # declarar a autorização novamente.
    declaracao_responsavel_menor: bool = False

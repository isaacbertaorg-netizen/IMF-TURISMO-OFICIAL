# ===========================================================================
# IMF TURISMO — schemas de excursão (RF01)
# Nomes de campo alinhados às colunas da tabela `excursao` do schema real.
# O id_admin é injetado pelo back-end a partir do admin autenticado.
# ===========================================================================

from datetime import date

from pydantic import BaseModel, Field, model_validator


class ExcursaoCreate(BaseModel):
    """Campos para cadastrar uma nova excursão (RF01)."""

    nome_excursao: str = Field(min_length=3, max_length=150)
    destino: str = Field(min_length=2, max_length=150)
    data_ida: date
    data_volta: date
    valor_pessoa: float = Field(gt=0)
    vagas_totais: int = Field(gt=0)
    descricao_roteiro: str = Field(min_length=10)
    itens_inclusos: str = Field(default="", max_length=1000)
    prazo_cancelamento_dias: int = Field(default=30, ge=0)

    @model_validator(mode="after")
    def validar_periodo(self):
        """A data de volta nunca pode ser anterior à data de ida."""
        if self.data_volta < self.data_ida:
            raise ValueError("A data de volta nao pode ser anterior a data de ida")
        return self


class ExcursaoUpdate(BaseModel):
    """Campos editáveis de uma excursão existente (todos opcionais)."""

    nome_excursao: str | None = Field(default=None, min_length=3, max_length=150)
    destino: str | None = Field(default=None, min_length=2, max_length=150)
    data_ida: date | None = None
    data_volta: date | None = None
    valor_pessoa: float | None = Field(default=None, gt=0)
    vagas_totais: int | None = Field(default=None, gt=0)
    descricao_roteiro: str | None = Field(default=None, min_length=10)
    itens_inclusos: str | None = Field(default=None, max_length=1000)
    prazo_cancelamento_dias: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def validar_periodo(self):
        """Valida o período somente quando as duas datas forem informadas."""
        if self.data_ida and self.data_volta and self.data_volta < self.data_ida:
            raise ValueError("A data de volta nao pode ser anterior a data de ida")
        return self

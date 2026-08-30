# ===========================================================================
# IMF TURISMO — schemas de excursão
# Validação de criação/edição de excursões (RF01) e dos filtros de listagem
# (RF02, seção 3.1 do PRODUCT.md).
# ===========================================================================

from datetime import date

from pydantic import BaseModel, Field, model_validator


class ExcursaoCreate(BaseModel):
    """Campos para cadastrar uma nova excursão (RF01).

    O formulário real exige data de ida E data de volta (o protótipo mostrava
    um único campo "Data" — a especificação prevalece).
    """

    nome: str = Field(min_length=3, max_length=150)
    destino: str = Field(min_length=2, max_length=120)
    data_saida: date
    data_retorno: date
    preco: float = Field(gt=0)
    vagas_totais: int = Field(gt=0)
    descricao: str = Field(min_length=10)
    itens_inclusos: str = Field(default="", max_length=1000)
    prazo_cancelamento_dias: int = Field(default=0, ge=0)
    imagem_url: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validar_periodo(self):
        """A data de retorno nunca pode ser anterior à data de saída."""
        if self.data_retorno < self.data_saida:
            raise ValueError("A data de retorno nao pode ser anterior a data de saida")
        return self


class ExcursaoUpdate(BaseModel):
    """Campos editáveis de uma excursão existente (todos opcionais)."""

    nome: str | None = Field(default=None, min_length=3, max_length=150)
    destino: str | None = Field(default=None, min_length=2, max_length=120)
    data_saida: date | None = None
    data_retorno: date | None = None
    preco: float | None = Field(default=None, gt=0)
    vagas_totais: int | None = Field(default=None, gt=0)
    descricao: str | None = Field(default=None, min_length=10)
    itens_inclusos: str | None = Field(default=None, max_length=1000)
    prazo_cancelamento_dias: int | None = Field(default=None, ge=0)
    imagem_url: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validar_periodo(self):
        """Valida o período somente quando as duas datas forem informadas."""
        if self.data_saida and self.data_retorno and self.data_retorno < self.data_saida:
            raise ValueError("A data de retorno nao pode ser anterior a data de saida")
        return self

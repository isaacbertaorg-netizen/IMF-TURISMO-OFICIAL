# ===========================================================================
# IMF TURISMO — serviço de excursões
# Listagem com filtros (RF02), consulta por id.
# Toda query usa o client parametrizado do Supabase (seção 6.1).
# Colunas conforme o schema real: nome_excursao, data_ida, data_volta, valor_pessoa.
# ===========================================================================

from datetime import date
from typing import Any

from app.core import supabase
from app.core.exceptions import RecursoNaoEncontradoError


def listar_excursoes(
    destino: str | None = None,
    data_inicio: date | None = None,
    data_fim: date | None = None,
    preco_min: float | None = None,
    preco_max: float | None = None,
) -> list[dict[str, Any]]:
    """Lista excursões aplicando os filtros exigidos pelo RF02.

    Cada filtro é adicionado de forma incremental, sempre com os métodos
    parametrizados do client (eq/gte/lte/ilike), evitando injeção.
    """
    query = supabase.get_supabase().table("excursao").select("*")

    if destino:
        # Busca parcial e case-insensitive pelo nome do destino.
        query = query.ilike("destino", f"%{destino}%")
    if data_inicio:
        # Excursões cuja data de ida ainda não aconteceu antes de data_inicio.
        query = query.gte("data_ida", data_inicio.isoformat())
    if data_fim:
        query = query.lte("data_volta", data_fim.isoformat())
    if preco_min is not None:
        query = query.gte("valor_pessoa", preco_min)
    if preco_max is not None:
        query = query.lte("valor_pessoa", preco_max)

    # Ordena pela data de ida para que a listagem tenha ordem previsível.
    return query.order("data_ida", desc=False).execute().data


def obter_excursao(id_excursao: int) -> dict[str, Any]:
    """Busca uma excursão pelo id, levantando 404 se não existir."""
    excursao = supabase.buscar_um(
        supabase.get_supabase().table("excursao").select("*").eq("id_excursao", id_excursao)
    )
    if excursao is None:
        raise RecursoNaoEncontradoError("Excursao nao encontrada")
    return excursao

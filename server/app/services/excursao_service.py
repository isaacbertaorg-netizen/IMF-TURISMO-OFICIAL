# ===========================================================================
# IMF TURISMO — serviço de excursões
# Listagem com filtros (RF02), consulta por id e consulta por destino.
# Toda query usa o client parametrizado do Supabase — nunca SQL concatenado
# (seção 6.1 do PRODUCT.md).
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

    Cada filtro é adicionado de forma incremental à query, sempre com os
    métodos parametrizados do client (eq/gte/lte/ilike), evitando injeção.
    """
    query = supabase.get_supabase().table("excursao").select("*")

    if destino:
        # Busca parcial e case-insensitive pelo nome do destino.
        query = query.ilike("destino", f"%{destino}%")
    if data_inicio:
        # Excursões cuja saída ainda não aconteceu antes de data_inicio.
        query = query.gte("data_saida", data_inicio.isoformat())
    if data_fim:
        query = query.lte("data_retorno", data_fim.isoformat())
    if preco_min is not None:
        query = query.gte("preco", preco_min)
    if preco_max is not None:
        query = query.lte("preco", preco_max)

    # Ordena por data de saída para que a listagem tenha ordem previsível.
    return query.order("data_saida", desc=False).execute().data


def obter_excursao(id_excursao: int) -> dict[str, Any]:
    """Busca uma excursão pelo id, levantando 404 se não existir."""
    excursao = (
        supabase.get_supabase()
        .table("excursao")
        .select("*")
        .eq("id", id_excursao)
        .maybe_single()
        .execute()
        .data
    )
    if excursao is None:
        raise RecursoNaoEncontradoError("Excursao nao encontrada")
    return excursao

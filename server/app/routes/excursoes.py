# ===========================================================================
# IMF TURISMO — rotas públicas de excursões
# GET /api/excursoes (listagem com filtros, RF02) e GET /api/excursoes/{id}
# (detalhes, seção 3.2 do PRODUCT.md).
# ===========================================================================

from datetime import date

from fastapi import APIRouter, Query

from app.services import excursao_service

router = APIRouter(tags=["excursoes"])


@router.get("/api/excursoes")
def listar_excursoes(
    destino: str | None = Query(default=None, max_length=120),
    data_inicio: date | None = Query(default=None),
    data_fim: date | None = Query(default=None),
    preco_min: float | None = Query(default=None, gt=0),
    preco_max: float | None = Query(default=None, gt=0),
):
    """Lista excursões aplicando os filtros de destino, data e faixa de preço."""
    return excursao_service.listar_excursoes(
        destino=destino,
        data_inicio=data_inicio,
        data_fim=data_fim,
        preco_min=preco_min,
        preco_max=preco_max,
    )


@router.get("/api/excursoes/{id_excursao}")
def obter_excursao(id_excursao: int):
    """Retorna os detalhes completos de uma excursão."""
    return excursao_service.obter_excursao(id_excursao)

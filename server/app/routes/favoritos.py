# ===========================================================================
# IMF TURISMO — rotas de favoritos do cliente
# GET    /api/favoritos
# POST   /api/favoritos/{id_excursao}
# DELETE /api/favoritos/{id_excursao}
#
# Todas exigem token de cliente; o id_cliente vem do token, nunca da URL.
# ===========================================================================

from fastapi import APIRouter, Depends

from app.core.auth import get_current_cliente
from app.services import favorito_service

router = APIRouter(tags=["favoritos"])


@router.get("/api/favoritos")
def listar_favoritos(cliente: dict = Depends(get_current_cliente)):
    """Lista as excursões favoritadas pelo cliente autenticado."""
    return favorito_service.listar_favoritos(cliente["id_cliente"])


@router.post("/api/favoritos/{id_excursao}", status_code=201)
def adicionar_favorito(id_excursao: int, cliente: dict = Depends(get_current_cliente)):
    """Favorita uma excursão para o cliente autenticado."""
    return favorito_service.adicionar_favorito(cliente["id_cliente"], id_excursao)


@router.delete("/api/favoritos/{id_excursao}")
def remover_favorito(id_excursao: int, cliente: dict = Depends(get_current_cliente)):
    """Remove a excursão dos favoritos do cliente autenticado."""
    return favorito_service.remover_favorito(cliente["id_cliente"], id_excursao)

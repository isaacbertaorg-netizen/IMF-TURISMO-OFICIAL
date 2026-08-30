# ===========================================================================
# IMF TURISMO — rotas de reserva do cliente (seção 3.4/3.5 do PRODUCT.md)
# POST /api/reservas          — cria reserva (rate limited, seção 6.5)
# GET  /api/reservas/minhas   — lista as reservas do cliente autenticado
# PATCH /api/reservas/{id}/cancelar — cancela dentro do prazo (RF06)
#
# Todas exigem token de cliente. O id_cliente vem do token (Depends), nunca
# do body da requisição (seção 6.2).
# ===========================================================================

from fastapi import APIRouter, Depends, Request

from app.config import settings
from app.core.auth import get_current_cliente
from app.core.rate_limit import limiter
from app.schemas.reserva import ReservaCreate
from app.services import reserva_service

router = APIRouter(tags=["reservas"])


@router.post("/api/reservas", status_code=201)
@limiter.limit(settings.rate_limit_reservas)
def criar_reserva(
    request: Request,
    dados: ReservaCreate,
    cliente: dict = Depends(get_current_cliente),
):
    """Cria uma reserva para o cliente autenticado, com um passageiro por vaga."""
    return reserva_service.criar_reserva(
        id_cliente=cliente["id_cliente"],
        id_excursao=dados.id_excursao,
        qtd_vagas=dados.qtd_vagas,
        passageiros=[p.model_dump() for p in dados.passageiros],
    )


@router.get("/api/reservas/minhas")
def listar_minhas(cliente: dict = Depends(get_current_cliente)):
    """Lista as reservas do cliente autenticado com status e destino."""
    return reserva_service.listar_minhas(cliente["id_cliente"])


@router.patch("/api/reservas/{id_reserva}/cancelar")
def cancelar_reserva(
    id_reserva: int,
    cliente: dict = Depends(get_current_cliente),
):
    """Cancela uma reserva do cliente, validando o prazo de cancelamento."""
    return reserva_service.cancelar_reserva(id_cliente=cliente["id_cliente"], id_reserva=id_reserva)

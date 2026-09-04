# ===========================================================================
# IMF TURISMO — rotas de perfil do cliente (seção 3.6 do PRODUCT.md)
# GET /api/perfil — dados cadastrais (sem senha). PUT /api/perfil — edita
# nome, telefone e endereço. O id_cliente vem do token (seção 6.2).
# ===========================================================================

from fastapi import APIRouter, Depends

from app.core.auth import get_current_cliente
from app.schemas.cliente import PerfilUpdate
from app.services import perfil_service

router = APIRouter(tags=["perfil"])


@router.get("/api/perfil")
def obter_perfil(cliente: dict = Depends(get_current_cliente)):
    """Retorna os dados cadastrais do cliente autenticado."""
    return perfil_service.obter_perfil(cliente["id_cliente"])


@router.put("/api/perfil")
def atualizar_perfil(dados: PerfilUpdate, cliente: dict = Depends(get_current_cliente)):
    """Atualiza os dados cadastrais editáveis do cliente autenticado."""
    return perfil_service.atualizar_perfil(cliente["id_cliente"], dados.model_dump())

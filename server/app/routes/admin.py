# ===========================================================================
# IMF TURISMO — rotas administrativas (seções 3.8 a 3.11 do PRODUCT.md)
# Todas as rotas abaixo do prefixo /api/admin/* passam por
# Depends(get_current_admin), que valida token + role ADMIN (seção 6.2).
# ===========================================================================

from fastapi import APIRouter, Depends

from app.core.auth import get_current_admin
from app.schemas.excursao import ExcursaoCreate, ExcursaoUpdate
from app.services import admin_service

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(get_current_admin)],
)


@router.get("/dashboard")
def dashboard():
    """Totais de reservas e clientes exibidos no painel (Imagem 6)."""
    return admin_service.dashboard()


@router.get("/excursoes")
def listar_excursoes():
    """Lista excursões para a tela de gerenciamento."""
    return admin_service.listar_excursoes()


@router.post("/excursoes", status_code=201)
def criar_excursao(dados: ExcursaoCreate, admin: dict = Depends(get_current_admin)):
    """Cadastra uma nova excursão vinculada ao administrador autenticado."""
    return admin_service.criar_excursao(id_admin=admin["id_admin"], dados=dados.model_dump())


@router.put("/excursoes/{id_excursao}")
def atualizar_excursao(id_excursao: int, dados: ExcursaoUpdate):
    """Edita os campos informados de uma excursão existente."""
    return admin_service.atualizar_excursao(id_excursao, dados.model_dump())


@router.delete("/excursoes/{id_excursao}", status_code=204)
def excluir_excursao(id_excursao: int):
    """Exclui uma excursão (ação destrutiva; no front há confirmação em modal)."""
    admin_service.excluir_excursao(id_excursao)


@router.get("/reservas")
def listar_reservas(status: str | None = None):
    """Lista reservas, com filtro opcional por status (seção 3.10)."""
    return admin_service.listar_reservas(status=status)


@router.patch("/reservas/{id_reserva}/cancelar")
def cancelar_reserva_manual(id_reserva: int):
    """Cancelamento manual pelo admin (RF06) em situações excepcionais."""
    return admin_service.cancelar_reserva_manual(id_reserva)


@router.get("/clientes")
def listar_clientes():
    """Lista clientes cadastrados (somente leitura, seção 3.11)."""
    return admin_service.listar_clientes()

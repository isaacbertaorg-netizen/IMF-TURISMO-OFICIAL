# ===========================================================================
# IMF TURISMO — configurações públicas consumidas pelo front-end
# O WhatsApp de atendimento é informação pública (divulgada no site) e o
# front precisa dele para montar o link wa.me do pagamento. Nada sensível
# deve ser exposto aqui.
# ===========================================================================

from fastapi import APIRouter

from app.config import settings

router = APIRouter(tags=["publico"])


@router.get("/api/config")
def config_publica():
    """Dados públicos de contato usados na tela de pagamento."""
    return {"whatsapp_numero": settings.whatsapp_numero}

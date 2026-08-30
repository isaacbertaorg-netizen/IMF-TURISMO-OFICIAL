# ===========================================================================
# IMF TURISMO — rota de healthcheck
# Rota leve e sem autenticação para monitorar se a API está operacional.
# ===========================================================================

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/api/health")
def healthcheck():
    return {"status": "ok", "service": "imf-turismo-api"}

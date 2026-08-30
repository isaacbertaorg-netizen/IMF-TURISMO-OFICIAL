# ===========================================================================
# IMF TURISMO — rate limiting
# Aplica limites de requisições nas rotas públicas sensíveis (seção 6.5 do
# PRODUCT.md): POST /api/login, POST /api/cadastro e POST /api/reservas.
# O limite é baseado no endereço IP de origem, prevenindo força bruta e spam.
#
# A flag `enabled` permite desativar o limite em desenvolvimento/testes via
# RATE_LIMIT_ENABLED=false no .env (ou fixture do conftest).
# ===========================================================================

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings

# key_func usa o IP de origem da requisição como chave de contagem.
limiter = Limiter(
    key_func=get_remote_address,
    enabled=settings.rate_limit_enabled,
)

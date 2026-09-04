# ===========================================================================
# IMF TURISMO — aplicação FastAPI (back-end)
# Ponto de entrada do servidor. Monta o app, registra os routers, aplica os
# headers de segurança (seção 6.4 do PRODUCT.md), o CORS restrito e o rate
# limiter (seção 6.5).
# ===========================================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.core.exceptions import DomainError, domain_error_handler
from app.core.rate_limit import limiter
from app.routes import admin, auth, excursoes, health, perfil, reservas

app = FastAPI(
    title="IMF Turismo API",
    description=(
        "API de gestão e planejamento de excursões da IMF Turismo. "
        "Back-end em FastAPI integrado ao Supabase."
    ),
    version="0.1.0",
)

# ---------------------------------------------------------------------------
# CORS restrito: somente o domínio oficial do front-end é aceito.
# Em produção NUNCA usar allow_origins=["*"] (seção 6.4 do PRODUCT.md).
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware do rate limiter: aplica os limites definidos nas rotas.
app.add_middleware(SlowAPIMiddleware)

# Expõe o limiter ao app para o handler de excesso de requisições funcionar.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Converte as exceções de negócio (services) em respostas HTTP adequadas.
app.add_exception_handler(DomainError, domain_error_handler)


# ---------------------------------------------------------------------------
# Headers de segurança (seção 6.4 do PRODUCT.md).
# Aplicados via middleware para proteger contra clickjacking, XSS e MIME
# sniffing, independentemente da rota acessada.
# ---------------------------------------------------------------------------
@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    # Impede que a página seja embutida em frames de terceiros (clickjacking).
    response.headers["X-Frame-Options"] = "DENY"
    # Impede o navegador de interpretar respostas como tipo diferente do declarado.
    response.headers["X-Content-Type-Options"] = "nosniff"
    # Política de conteúdo mínima; será ampliada conforme o front-end crescer.
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response


# ---------------------------------------------------------------------------
# Registro dos routers da API.
# ---------------------------------------------------------------------------
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(excursoes.router)
app.include_router(reservas.router)
app.include_router(perfil.router)
app.include_router(admin.router)

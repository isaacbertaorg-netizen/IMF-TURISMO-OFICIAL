# ===========================================================================
# IMF TURISMO — aplicação FastAPI (back-end)
# Ponto de entrada do servidor. Este módulo monta o app, aplica os headers de
# segurança exigidos na seção 6.4 do PRODUCT.md e expõe a rota de healthcheck
# usada para validar que o serviço está de pé.
#
# Este arquivo é um sanity check inicial: ainda não há integração com Supabase,
# rotas de negócio ou autenticação — essas camadas entram nos próximos
# checkpoints seguindo o fluxo TDD (seção 4 do PRODUCT.md).
# ===========================================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

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
# Os valores vêm de variáveis de ambiente para não endurecer o domínio no código.
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
# Healthcheck: rota leve e sem autenticação usada para verificar se a API
# está operacional (monitoramento e sanity check de deploy).
# ---------------------------------------------------------------------------
@app.get("/api/health", tags=["health"])
def healthcheck():
    return {"status": "ok", "service": "imf-turismo-api"}

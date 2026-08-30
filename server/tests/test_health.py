# ===========================================================================
# IMF TURISMO — teste do healthcheck (TDD, seção 4 do PRODUCT.md)
# Primeiro teste da suíte: valida que a rota /api/health responde corretamente
# e que os headers de segurança (seção 6.4) estão presentes na resposta.
# ===========================================================================

from fastapi.testclient import TestClient

from app.main import app

# TestClient usa httpx e permite exercitar a aplicação sem subir o servidor.
client = TestClient(app)


def test_healthcheck_retorna_ok():
    """A rota de healthcheck deve responder 200 com status 'ok'."""
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "imf-turismo-api"


def test_healthcheck_aplica_headers_de_seguranca():
    """A resposta deve trazer os headers de segurança definidos no main.py."""
    response = client.get("/api/health")
    # Clickjacking: a página não pode ser embutida em frames de terceiros.
    assert response.headers["X-Frame-Options"] == "DENY"
    # MIME sniffing bloqueado para evitar interpretação indevida do conteúdo.
    assert response.headers["X-Content-Type-Options"] == "nosniff"

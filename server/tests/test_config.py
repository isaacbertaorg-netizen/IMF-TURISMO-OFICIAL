# ===========================================================================
# IMF TURISMO — testes da configuração pública
# O front precisa do WhatsApp de atendimento para montar o link wa.me do
# pagamento. O número é público (está no site) e a rota não exige login.
# ===========================================================================

from app.config import settings


def test_config_publica_expoe_whatsapp(client):
    resp = client.get("/api/config")

    assert resp.status_code == 200
    numero = resp.json()["whatsapp_numero"]
    assert numero == settings.whatsapp_numero
    # O link wa.me só funciona com dígitos (DDI + DDD + número).
    assert numero.isdigit()

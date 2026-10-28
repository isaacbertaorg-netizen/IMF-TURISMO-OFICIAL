# ===========================================================================
# IMF TURISMO — testes de favoritos (RF novo)
# Cobre autenticação, inclusão idempotente, listagem, remoção e isolamento
# entre clientes.
# ===========================================================================

from datetime import date, timedelta


def seed_excursao(fake_supabase, **campos):
    base = {
        "id_excursao": 1,
        "id_admin": 1,
        "nome_excursao": "Caldas Novas",
        "destino": "Caldas Novas",
        "data_ida": (date.today() + timedelta(days=30)).isoformat(),
        "data_volta": (date.today() + timedelta(days=34)).isoformat(),
        "valor_pessoa": 1000.0,
        "vagas_totais": 20,
        "vagas_disponiveis": 20,
        "prazo_cancelamento_dias": 7,
        "descricao_roteiro": "Roteiro de teste.",
        "itens_inclusos": "Hospedagem",
    }
    base.update(campos)
    fake_supabase.seed("excursao", [base])


def test_favoritos_requer_autenticacao(client):
    assert client.get("/api/favoritos").status_code == 401
    assert client.post("/api/favoritos/1").status_code == 401
    assert client.delete("/api/favoritos/1").status_code == 401


def test_adicionar_listar_e_remover_favorito(client, fake_supabase, cliente_token):
    seed_excursao(fake_supabase)
    headers = {"Authorization": f"Bearer {cliente_token}"}

    assert client.get("/api/favoritos", headers=headers).json() == []

    resp = client.post("/api/favoritos/1", headers=headers)
    assert resp.status_code == 201
    assert resp.json()["id_excursao"] == 1
    assert resp.json()["favorito"] is True

    # Repetir não duplica o vínculo.
    resp = client.post("/api/favoritos/1", headers=headers)
    assert resp.status_code == 201
    assert len(fake_supabase.tables["favorito"]) == 1

    resp = client.get("/api/favoritos", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["destino"] == "Caldas Novas"

    resp = client.delete("/api/favoritos/1", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["favorito"] is False
    assert client.get("/api/favoritos", headers=headers).json() == []


def test_favoritar_excursao_inexistente_retorna_404(client, cliente_token):
    resp = client.post(
        "/api/favoritos/999",
        headers={"Authorization": f"Bearer {cliente_token}"},
    )
    assert resp.status_code == 404


def test_favoritos_sao_isolados_por_cliente(client, fake_supabase, cliente_token):
    seed_excursao(fake_supabase)
    fake_supabase.seed(
        "favorito",
        [{"id_favorito": 1, "id_cliente": 999, "id_excursao": 1, "criado_em": "2026-10-01"}],
    )

    resp = client.get(
        "/api/favoritos",
        headers={"Authorization": f"Bearer {cliente_token}"},
    )
    assert resp.status_code == 200
    assert resp.json() == []

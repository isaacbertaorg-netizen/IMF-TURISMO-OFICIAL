# ===========================================================================
# IMF TURISMO — testes das rotas administrativas (seções 3.8 a 3.11)
# Cobre dashboard, CRUD de excursões, gestão de reservas e listagem de
# clientes, sempre autenticado como administrador (role ADMIN).
# ===========================================================================

import pytest


@pytest.fixture()
def headers_admin(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


def test_dashboard_retorna_totais(client, fake_supabase, headers_admin):
    fake_supabase.seed(
        "reserva",
        [
            {
                "id": 1,
                "id_cliente": 1,
                "id_excursao": 1,
                "qtd_vagas": 2,
                "status": "pendente",
                "data_criacao": "2026-08-01T10:00:00",
            }
        ],
    )
    fake_supabase.seed(
        "reserva",
        [
            {
                "id": 2,
                "id_cliente": 1,
                "id_excursao": 1,
                "qtd_vagas": 1,
                "status": "confirmada",
                "data_criacao": "2026-08-02T10:00:00",
            }
        ],
    )
    fake_supabase.seed(
        "cliente",
        [
            {
                "id": 1,
                "id_auth_user": "auth-1",
                "nome": "A",
                "cpf": "1" * 11,
                "email": "a@b.com",
                "telefone": "61",
                "endereco": "x",
            }
        ],
    )
    fake_supabase.seed(
        "cliente",
        [
            {
                "id": 2,
                "id_auth_user": "auth-2",
                "nome": "B",
                "cpf": "2" * 11,
                "email": "b@b.com",
                "telefone": "61",
                "endereco": "y",
            }
        ],
    )

    resp = client.get("/api/admin/dashboard", headers=headers_admin)
    assert resp.status_code == 200
    assert resp.json() == {"total_reservas": 2, "total_clientes": 2}


def test_criar_excursao_inicia_vagas_iguais_ao_total(client, headers_admin):
    payload = {
        "nome": "Nova Excursao",
        "destino": "Jericoacoara",
        "data_saida": "2027-07-10",
        "data_retorno": "2027-07-17",
        "preco": 1200.0,
        "vagas_totais": 25,
        "descricao": "Pacote com buggy e passeio de jangada.",
        "itens_inclusos": "Hospedagem, cafe da manha",
        "prazo_cancelamento_dias": 10,
    }
    resp = client.post("/api/admin/excursoes", json=payload, headers=headers_admin)
    assert resp.status_code == 201
    assert resp.json()["vagas_disponiveis"] == 25


def test_criar_excursao_rejeita_periodo_invertido(client, headers_admin):
    payload = {
        "nome": "Periodo Invalido",
        "destino": "Recife",
        "data_saida": "2027-08-20",
        "data_retorno": "2027-08-10",  # volta antes da ida -> deve falhar
        "preco": 900.0,
        "vagas_totais": 10,
        "descricao": "Descricao valida de teste.",
    }
    resp = client.post("/api/admin/excursoes", json=payload, headers=headers_admin)
    assert resp.status_code == 422


def test_atualizar_excursao(client, fake_supabase, headers_admin):
    fake_supabase.seed(
        "excursao",
        [
            {
                "id": 5,
                "nome": "Antiga",
                "destino": "X",
                "data_saida": "2027-01-01",
                "data_retorno": "2027-01-05",
                "preco": 100.0,
                "vagas_totais": 10,
                "vagas_disponiveis": 10,
                "descricao": "Descricao antiga",
                "itens_inclusos": "",
            }
        ],
    )
    resp = client.put(
        "/api/admin/excursoes/5",
        json={"preco": 150.0, "nome": "Atualizada"},
        headers=headers_admin,
    )
    assert resp.status_code == 200
    assert resp.json()["preco"] == 150.0
    assert resp.json()["nome"] == "Atualizada"


def test_atualizar_excursao_inexistente_retorna_404(client, headers_admin):
    resp = client.put("/api/admin/excursoes/999", json={"preco": 1.0}, headers=headers_admin)
    assert resp.status_code == 404


def test_excluir_excursao(client, fake_supabase, headers_admin):
    fake_supabase.seed(
        "excursao",
        [
            {
                "id": 7,
                "nome": "Para Excluir",
                "destino": "X",
                "data_saida": "2027-01-01",
                "data_retorno": "2027-01-05",
                "preco": 50.0,
                "vagas_totais": 5,
                "vagas_disponiveis": 5,
                "descricao": "Descricao",
                "itens_inclusos": "",
            }
        ],
    )
    resp = client.delete("/api/admin/excursoes/7", headers=headers_admin)
    assert resp.status_code == 204
    assert fake_supabase.table("excursao").select("*").execute().data == []


def test_excluir_excursao_inexistente_retorna_404(client, headers_admin):
    resp = client.delete("/api/admin/excursoes/999", headers=headers_admin)
    assert resp.status_code == 404


def test_listar_reservas_com_filtro_de_status(client, fake_supabase, headers_admin):
    fake_supabase.seed(
        "reserva",
        [
            {
                "id": 1,
                "id_cliente": 1,
                "id_excursao": 1,
                "qtd_vagas": 2,
                "status": "pendente",
                "data_criacao": "2026-08-01",
            },
            {
                "id": 2,
                "id_cliente": 1,
                "id_excursao": 1,
                "qtd_vagas": 1,
                "status": "confirmada",
                "data_criacao": "2026-08-02",
            },
            {
                "id": 3,
                "id_cliente": 1,
                "id_excursao": 1,
                "qtd_vagas": 3,
                "status": "pendente",
                "data_criacao": "2026-08-03",
            },
        ],
    )

    resp = client.get("/api/admin/reservas", headers=headers_admin)
    assert resp.status_code == 200
    assert len(resp.json()) == 3

    resp = client.get("/api/admin/reservas", params={"status": "pendente"}, headers=headers_admin)
    assert resp.status_code == 200
    assert [r["id"] for r in resp.json()] == [3, 1]


def test_cancelamento_manual_pelo_admin(client, fake_supabase, headers_admin):
    fake_supabase.seed(
        "excursao",
        [
            {
                "id": 1,
                "nome": "X",
                "destino": "Y",
                "data_saida": "2027-01-01",
                "data_retorno": "2027-01-05",
                "preco": 10.0,
                "vagas_totais": 10,
                "vagas_disponiveis": 8,
                "descricao": "D",
                "itens_inclusos": "",
            }
        ],
    )
    fake_supabase.seed(
        "reserva",
        [
            {
                "id": 1,
                "id_cliente": 1,
                "id_excursao": 1,
                "qtd_vagas": 2,
                "status": "pendente",
                "data_criacao": "2026-08-01",
            }
        ],
    )

    resp = client.patch("/api/admin/reservas/1/cancelar", headers=headers_admin)
    assert resp.status_code == 200
    assert resp.json()["status"] == "cancelada"

    # O cancelamento manual também devolve as vagas ao estoque.
    excursao = fake_supabase.table("excursao").select("*").eq("id", 1).maybe_single().execute().data
    assert excursao["vagas_disponiveis"] == 10


def test_listar_clientes_sem_dados_sensiveis(client, fake_supabase, headers_admin):
    fake_supabase.seed(
        "cliente",
        [
            {
                "id": 1,
                "id_auth_user": "auth-1",
                "nome": "Maria",
                "cpf": "1" * 11,
                "email": "maria@x.com",
                "telefone": "6199",
                "endereco": "Rua X",
            }
        ],
    )
    resp = client.get("/api/admin/clientes", headers=headers_admin)
    assert resp.status_code == 200
    assert resp.json()[0]["nome"] == "Maria"
    # Nunca expor senha/hash (a senha vive no Supabase Auth).
    assert "senha" not in resp.json()[0]
    assert "password" not in resp.json()[0]

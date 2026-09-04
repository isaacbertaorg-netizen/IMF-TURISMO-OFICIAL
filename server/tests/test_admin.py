# ===========================================================================
# IMF TURISMO — testes das rotas administrativas (seções 3.8 a 3.11)
# Cobre dashboard, CRUD de excursões, gestão de reservas e listagem de
# clientes, sempre autenticado como administrador.
# ===========================================================================

import pytest


@pytest.fixture()
def headers_admin(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


def seed_excursao(fake_supabase, **campos):
    base = {
        "id_excursao": 1,
        "id_admin": 1,
        "nome_excursao": "X",
        "destino": "Y",
        "data_ida": "2027-01-01",
        "data_volta": "2027-01-05",
        "valor_pessoa": 10.0,
        "vagas_totais": 10,
        "vagas_disponiveis": 10,
        "prazo_cancelamento_dias": 7,
        "descricao_roteiro": "Descricao",
        "itens_inclusos": "",
    }
    base.update(campos)
    fake_supabase.seed("excursao", [base])


def test_dashboard_retorna_totais(client, fake_supabase, headers_admin):
    fake_supabase.seed(
        "reserva",
        [
            {
                "id_reserva": 1,
                "id_cliente": 1,
                "id_excursao": 1,
                "qtd_vagas": 2,
                "status": "pendente",
                "data_reserva": "2026-08-01T10:00:00",
            }
        ],
    )
    fake_supabase.seed(
        "reserva",
        [
            {
                "id_reserva": 2,
                "id_cliente": 1,
                "id_excursao": 1,
                "qtd_vagas": 1,
                "status": "confirmada",
                "data_reserva": "2026-08-02T10:00:00",
            }
        ],
    )
    fake_supabase.seed(
        "cliente",
        [
            {
                "id_cliente": 1,
                "nome_cliente": "A",
                "cpf": "1" * 11,
                "email": "a@b.com",
                "telefone": "61",
                "cidade": "Brasilia",
                "uf": "DF",
            }
        ],
    )
    fake_supabase.seed(
        "cliente",
        [
            {
                "id_cliente": 2,
                "nome_cliente": "B",
                "cpf": "2" * 11,
                "email": "b@b.com",
                "telefone": "61",
                "cidade": "Goiania",
                "uf": "GO",
            }
        ],
    )

    resp = client.get("/api/admin/dashboard", headers=headers_admin)
    assert resp.status_code == 200
    assert resp.json() == {"total_reservas": 2, "total_clientes": 2}


def test_criar_excursao_inicia_vagas_iguais_ao_total(client, headers_admin):
    payload = {
        "nome_excursao": "Nova Excursao",
        "destino": "Jericoacoara",
        "data_ida": "2027-07-10",
        "data_volta": "2027-07-17",
        "valor_pessoa": 1200.0,
        "vagas_totais": 25,
        "descricao_roteiro": "Pacote com buggy e passeio de jangada.",
        "itens_inclusos": "Hospedagem, cafe da manha",
        "prazo_cancelamento_dias": 10,
    }
    resp = client.post("/api/admin/excursoes", json=payload, headers=headers_admin)
    assert resp.status_code == 201
    assert resp.json()["vagas_disponiveis"] == 25
    assert resp.json()["id_admin"] == 1


def test_criar_excursao_rejeita_periodo_invertido(client, headers_admin):
    payload = {
        "nome_excursao": "Periodo Invalido",
        "destino": "Recife",
        "data_ida": "2027-08-20",
        "data_volta": "2027-08-10",  # volta antes da ida -> deve falhar
        "valor_pessoa": 900.0,
        "vagas_totais": 10,
        "descricao_roteiro": "Descricao valida de teste.",
    }
    resp = client.post("/api/admin/excursoes", json=payload, headers=headers_admin)
    assert resp.status_code == 422


def test_atualizar_excursao(client, fake_supabase, headers_admin):
    seed_excursao(fake_supabase, nome_excursao="Antiga", destino="X", valor_pessoa=100.0)
    resp = client.put(
        "/api/admin/excursoes/1",
        json={"valor_pessoa": 150.0, "nome_excursao": "Atualizada"},
        headers=headers_admin,
    )
    assert resp.status_code == 200
    assert resp.json()["valor_pessoa"] == 150.0
    assert resp.json()["nome_excursao"] == "Atualizada"


def test_atualizar_excursao_inexistente_retorna_404(client, headers_admin):
    resp = client.put("/api/admin/excursoes/999", json={"valor_pessoa": 1.0}, headers=headers_admin)
    assert resp.status_code == 404


def test_excluir_excursao(client, fake_supabase, headers_admin):
    seed_excursao(fake_supabase, nome_excursao="Para Excluir")
    resp = client.delete("/api/admin/excursoes/1", headers=headers_admin)
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
                "id_reserva": 1,
                "id_cliente": 1,
                "id_excursao": 1,
                "qtd_vagas": 2,
                "status": "pendente",
                "data_reserva": "2026-08-01",
            },
            {
                "id_reserva": 2,
                "id_cliente": 1,
                "id_excursao": 1,
                "qtd_vagas": 1,
                "status": "confirmada",
                "data_reserva": "2026-08-02",
            },
            {
                "id_reserva": 3,
                "id_cliente": 1,
                "id_excursao": 1,
                "qtd_vagas": 3,
                "status": "pendente",
                "data_reserva": "2026-08-03",
            },
        ],
    )

    resp = client.get("/api/admin/reservas", headers=headers_admin)
    assert resp.status_code == 200
    assert len(resp.json()) == 3

    resp = client.get("/api/admin/reservas", params={"status": "pendente"}, headers=headers_admin)
    assert resp.status_code == 200
    assert [r["id_reserva"] for r in resp.json()] == [3, 1]


def test_cancelamento_manual_pelo_admin(client, fake_supabase, headers_admin):
    # 2 vagas já reservadas -> vagas_disponiveis = 8 (de 10 totais).
    seed_excursao(fake_supabase, vagas_totais=10, vagas_disponiveis=8)
    fake_supabase.seed(
        "reserva",
        [
            {
                "id_reserva": 1,
                "id_cliente": 1,
                "id_excursao": 1,
                "qtd_vagas": 2,
                "status": "pendente",
                "data_reserva": "2026-08-01",
            }
        ],
    )

    resp = client.patch("/api/admin/reservas/1/cancelar", headers=headers_admin)
    assert resp.status_code == 200
    assert resp.json()["status"] == "cancelada"

    # Trigger simulado devolve as vagas ao estoque no cancelamento manual.
    excursao = (
        fake_supabase.table("excursao")
        .select("*")
        .eq("id_excursao", 1)
        .maybe_single()
        .execute()
        .data
    )
    assert excursao["vagas_disponiveis"] == 10


def test_listar_clientes_sem_dados_sensiveis(client, fake_supabase, headers_admin):
    fake_supabase.seed(
        "cliente",
        [
            {
                "id_cliente": 1,
                "nome_cliente": "Maria",
                "cpf": "1" * 11,
                "email": "maria@x.com",
                "telefone": "6199",
                "cidade": "Brasilia",
                "uf": "DF",
                "senha_hash": "hash-secreto",
            }
        ],
    )
    resp = client.get("/api/admin/clientes", headers=headers_admin)
    assert resp.status_code == 200
    assert resp.json()[0]["nome_cliente"] == "Maria"
    # Nunca expor o hash de senha.
    assert "senha_hash" not in resp.json()[0]

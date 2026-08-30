# ===========================================================================
# IMF TURISMO — testes de reservas (RF04/RF05/RF06, seções 3.4/3.5 do PRODUCT.md)
# Cobre criação de reserva com passageiros, cancelamento dentro e fora do
# prazo (prazo_cancelamento_dias) e a devolução das vagas ao estoque.
# ===========================================================================

from datetime import date, timedelta

import pytest


def seed_excursao(fake_supabase, **campos):
    """Semeadura de uma excursão com defaults controlados pelos testes."""
    base = {
        "id": 100,
        "nome": "Caldas Novas - Default",
        "destino": "Caldas Novas",
        "data_saida": (date.today() + timedelta(days=30)).isoformat(),
        "data_retorno": (date.today() + timedelta(days=34)).isoformat(),
        "preco": 179.0,
        "vagas_totais": 20,
        "vagas_disponiveis": 20,
        "prazo_cancelamento_dias": 7,
        "descricao": "Pacote padrao de teste.",
        "itens_inclusos": "Hospedagem",
    }
    base.update(campos)
    fake_supabase.seed("excursao", [base])
    return base


@pytest.fixture()
def cliente_autenticado(client, fake_supabase, cliente_token):
    """Retorna o token de cliente pronto para uso nos headers."""
    return {"Authorization": f"Bearer {cliente_token}"}


def fazer_reserva(client, headers, id_excursao=100, qtd=2):
    passageiros = [
        {"nome": f"Passageiro {i}", "cpf": f"{i:011d}", "data_nascimento": "1990-05-10"}
        for i in range(qtd)
    ]
    return client.post(
        "/api/reservas",
        json={"id_excursao": id_excursao, "qtd_vagas": qtd, "passageiros": passageiros},
        headers=headers,
    )


def test_criacao_de_reserva_com_passageiros(client, fake_supabase, cliente_autenticado):
    seed_excursao(fake_supabase)

    resp = fazer_reserva(client, cliente_autenticado, qtd=2)

    assert resp.status_code == 201
    reserva = resp.json()
    # Reserva nasce com status pendente até a confirmação de pagamento.
    assert reserva["status"] == "pendente"
    assert reserva["qtd_vagas"] == 2

    # As vagas da excursão devem ser decrementadas após a reserva.
    excursao = (
        fake_supabase.table("excursao").select("*").eq("id", 100).maybe_single().execute().data
    )
    assert excursao["vagas_disponiveis"] == 18

    # Um passageiro por vaga deve ser gravado na tabela passageiro.
    passageiros = fake_supabase.table("passageiro").select("*").execute().data
    assert len(passageiros) == 2


def test_criacao_rejeita_qtd_passageiros_divergente(client, fake_supabase, cliente_autenticado):
    seed_excursao(fake_supabase)

    payload = {
        "id_excursao": 100,
        "qtd_vagas": 3,
        "passageiros": [{"nome": "So Um", "cpf": "12345678901", "data_nascimento": "1990-05-10"}],
    }
    resp = client.post("/api/reservas", json=payload, headers=cliente_autenticado)
    # Validação de schema do Pydantic impede a divergência (seção 6.1).
    assert resp.status_code == 422


def test_reserva_requer_autenticacao(client, fake_supabase):
    """Rotas de reserva devem retornar 401 sem token válido (seção 6.2)."""
    seed_excursao(fake_supabase)
    resp = fazer_reserva(client, {})
    assert resp.status_code == 401


def test_minhas_reservas_lista_apenas_do_cliente(client, fake_supabase, cliente_token):
    seed_excursao(fake_supabase)
    # Reserva de OUTRO cliente para garantir que não vaza na listagem.
    fake_supabase.seed(
        "cliente",
        [
            {
                "id": 2,
                "id_auth_user": "auth-outro",
                "nome": "Outro",
                "cpf": "99999999999",
                "email": "outro@teste.com",
                "telefone": "61988888888",
                "endereco": "Rua B",
            }
        ],
    )
    fake_supabase.seed(
        "reserva",
        [
            {
                "id": 1,
                "id_cliente": 1,
                "id_excursao": 100,
                "qtd_vagas": 2,
                "status": "pendente",
                "data_criacao": "2026-08-01T10:00:00",
            },
            {
                "id": 2,
                "id_cliente": 2,
                "id_excursao": 100,
                "qtd_vagas": 1,
                "status": "pendente",
                "data_criacao": "2026-08-02T10:00:00",
            },
        ],
    )

    resp = client.get("/api/reservas/minhas", headers={"Authorization": f"Bearer {cliente_token}"})

    assert resp.status_code == 200
    reservas = resp.json()
    assert len(reservas) == 1
    assert reservas[0]["id"] == 1
    # A listagem enriquece a reserva com o destino da excursão.
    assert reservas[0]["excursao_destino"] == "Caldas Novas"


def test_cancelamento_dentro_do_prazo_devolve_vagas(client, fake_supabase, cliente_token):
    seed_excursao(fake_supabase, data_saida=(date.today() + timedelta(days=30)).isoformat())
    headers = {"Authorization": f"Bearer {cliente_token}"}

    criada = fazer_reserva(client, headers, qtd=2).json()
    resp = client.patch(f"/api/reservas/{criada['id']}/cancelar", headers=headers)

    assert resp.status_code == 200
    assert resp.json()["status"] == "cancelada"

    # As vagas devem voltar ao estoque após o cancelamento (RF06).
    excursao = (
        fake_supabase.table("excursao").select("*").eq("id", 100).maybe_single().execute().data
    )
    assert excursao["vagas_disponiveis"] == 20


def test_cancelamento_fora_do_prazo_e_rejeitado(client, fake_supabase, cliente_token):
    # Excursão saindo em 2 dias com prazo de 7: já não é possível cancelar.
    seed_excursao(fake_supabase, data_saida=(date.today() + timedelta(days=2)).isoformat())
    headers = {"Authorization": f"Bearer {cliente_token}"}

    criada = fazer_reserva(client, headers, qtd=1).json()
    resp = client.patch(f"/api/reservas/{criada['id']}/cancelar", headers=headers)

    assert resp.status_code == 400
    assert "prazo" in resp.json()["detail"].lower()

    # A reserva permanece pendente e as vagas não são devolvidas.
    reserva = (
        fake_supabase.table("reserva")
        .select("*")
        .eq("id", criada["id"])
        .maybe_single()
        .execute()
        .data
    )
    assert reserva["status"] == "pendente"


def test_cliente_nao_cancela_reserva_de_outro(client, fake_supabase, cliente_token):
    seed_excursao(fake_supabase)
    fake_supabase.seed(
        "reserva",
        [
            {
                "id": 77,
                "id_cliente": 999,
                "id_excursao": 100,
                "qtd_vagas": 1,
                "status": "pendente",
                "data_criacao": "2026-08-01T10:00:00",
            }
        ],
    )

    resp = client.patch(
        "/api/reservas/77/cancelar", headers={"Authorization": f"Bearer {cliente_token}"}
    )
    # Tratado como inexistente para não vazar a existência de reservas alheias.
    assert resp.status_code == 404

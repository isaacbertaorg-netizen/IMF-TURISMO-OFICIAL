# ===========================================================================
# IMF TURISMO — testes de edição de passageiros (botão continuar editando)
# Cobre PUT /api/reservas/:id/passageiros: troca de dados sem mexer no
# estoque, rejeição de quantidade divergente, de reserva alheia e de reserva
# cancelada, além do enriquecimento de prazo/passageiros em /minhas.
# ===========================================================================

from datetime import date, timedelta


def seed_excursao(fake_supabase, **campos):
    base = {
        "id_excursao": 100,
        "id_admin": 1,
        "nome_excursao": "Caldas Novas - Default",
        "destino": "Caldas Novas",
        "data_ida": (date.today() + timedelta(days=30)).isoformat(),
        "data_volta": (date.today() + timedelta(days=34)).isoformat(),
        "valor_pessoa": 179.0,
        "vagas_totais": 20,
        "vagas_disponiveis": 20,
        "prazo_cancelamento_dias": 7,
        "descricao_roteiro": "Pacote padrao de teste.",
        "itens_inclusos": "Hospedagem",
    }
    base.update(campos)
    fake_supabase.seed("excursao", [base])
    return base


def fazer_reserva(client, headers, id_excursao=100, qtd=2):
    passageiros = [
        {
            "nome_passageiro": f"Passageiro {i}",
            "cpf": f"{i:011d}",
            "data_nascimento": "1990-05-10",
        }
        for i in range(qtd)
    ]
    return client.post(
        "/api/reservas",
        json={"id_excursao": id_excursao, "qtd_vagas": qtd, "passageiros": passageiros},
        headers=headers,
    )


def test_editar_passageiros_da_propria_reserva(client, fake_supabase, cliente_token):
    seed_excursao(fake_supabase)
    headers = {"Authorization": f"Bearer {cliente_token}"}

    criada = fazer_reserva(client, headers, qtd=2).json()

    novos = [
        {"nome_passageiro": "Maria Silva", "cpf": "11111111111", "data_nascimento": "1985-03-20"},
        {"nome_passageiro": "Joao Silva", "cpf": "22222222222", "data_nascimento": "2010-07-11"},
    ]
    resp = client.put(
        f"/api/reservas/{criada['id_reserva']}/passageiros",
        json={"passageiros": novos},
        headers=headers,
    )

    assert resp.status_code == 200

    passageiros = (
        fake_supabase.table("passageiro")
        .select("*")
        .eq("id_reserva", criada["id_reserva"])
        .execute()
        .data
    )
    assert sorted(p["nome_passageiro"] for p in passageiros) == ["Joao Silva", "Maria Silva"]

    # A quantidade de vagas não muda, então o estoque segue intacto.
    excursao = (
        fake_supabase.table("excursao")
        .select("*")
        .eq("id_excursao", 100)
        .maybe_single()
        .execute()
        .data
    )
    assert excursao["vagas_disponiveis"] == 18


def test_editar_passageiros_rejeita_qtd_divergente(client, fake_supabase, cliente_token):
    seed_excursao(fake_supabase)
    headers = {"Authorization": f"Bearer {cliente_token}"}

    criada = fazer_reserva(client, headers, qtd=2).json()
    resp = client.put(
        f"/api/reservas/{criada['id_reserva']}/passageiros",
        json={
            "passageiros": [
                {"nome_passageiro": "So Um", "cpf": "12345678901", "data_nascimento": "1990-05-10"}
            ]
        },
        headers=headers,
    )

    assert resp.status_code == 422


def test_editar_passageiros_de_outro_cliente_retorna_404(client, fake_supabase, cliente_token):
    seed_excursao(fake_supabase)
    fake_supabase.seed(
        "reserva",
        [
            {
                "id_reserva": 77,
                "id_cliente": 999,
                "id_excursao": 100,
                "qtd_vagas": 1,
                "status": "pendente",
                "data_reserva": "2026-08-01T10:00:00",
            }
        ],
    )
    resp = client.put(
        "/api/reservas/77/passageiros",
        json={
            "passageiros": [
                {
                    "nome_passageiro": "Outro Nome",
                    "cpf": "12345678901",
                    "data_nascimento": "1990-05-10",
                }
            ]
        },
        headers={"Authorization": f"Bearer {cliente_token}"},
    )

    assert resp.status_code == 404


def test_editar_passageiros_de_reserva_cancelada_e_rejeitado(client, fake_supabase, cliente_token):
    seed_excursao(fake_supabase, data_ida=(date.today() + timedelta(days=30)).isoformat())
    headers = {"Authorization": f"Bearer {cliente_token}"}

    criada = fazer_reserva(client, headers, qtd=1).json()
    client.patch(f"/api/reservas/{criada['id_reserva']}/cancelar", headers=headers)
    resp = client.put(
        f"/api/reservas/{criada['id_reserva']}/passageiros",
        json={
            "passageiros": [
                {
                    "nome_passageiro": "Nome Novo",
                    "cpf": "12345678901",
                    "data_nascimento": "1990-05-10",
                }
            ]
        },
        headers=headers,
    )

    assert resp.status_code == 400


def test_minhas_reservas_traz_prazo_e_passageiros(client, fake_supabase, cliente_token):
    base = seed_excursao(fake_supabase)
    headers = {"Authorization": f"Bearer {cliente_token}"}

    fazer_reserva(client, headers, qtd=1)
    resp = client.get("/api/reservas/minhas", headers=headers)

    assert resp.status_code == 200
    item = resp.json()[0]
    assert item["prazo_cancelamento_dias"] == 7
    assert item["data_ida"] == base["data_ida"]
    assert len(item["passageiros"]) == 1
    assert item["passageiros"][0]["nome_passageiro"].startswith("Passageiro")

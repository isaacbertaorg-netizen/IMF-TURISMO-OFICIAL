# ===========================================================================
# IMF TURISMO — testes de excursões (RF02, seção 3.1 do PRODUCT.md)
# Cobre a listagem com filtros (destino, data, faixa de preço), os detalhes
# de uma excursão e a rejeição de overbooking na criação de reserva.
# ===========================================================================

import pytest


@pytest.fixture()
def excursoes_semeadas(fake_supabase):
    """Base de excursões usada nos testes de listagem e filtros."""
    fake_supabase.seed(
        "excursao",
        [
            {
                "id": 1,
                "nome": "Caldas Novas - Ferias",
                "destino": "Caldas Novas",
                "data_saida": "2026-12-10",
                "data_retorno": "2026-12-14",
                "preco": 179.0,
                "vagas_totais": 30,
                "vagas_disponiveis": 20,
                "prazo_cancelamento_dias": 7,
                "descricao": "Pacote com hospedagem e parque aquatico.",
                "itens_inclusos": "Hospedagem, cafe da manha",
            },
            {
                "id": 2,
                "nome": "Porto de Galinhas - Praia",
                "destino": "Porto de Galinhas",
                "data_saida": "2027-01-20",
                "data_retorno": "2027-01-27",
                "preco": 950.0,
                "vagas_totais": 10,
                "vagas_disponiveis": 10,
                "prazo_cancelamento_dias": 15,
                "descricao": "Pacote com piscinas naturais.",
                "itens_inclusos": "Hospedagem, passeios",
            },
            {
                "id": 3,
                "nome": "Caldas Novas - Aniversario",
                "destino": "Caldas Novas",
                "data_saida": "2027-03-05",
                "data_retorno": "2027-03-09",
                "preco": 210.0,
                "vagas_totais": 15,
                "vagas_disponiveis": 15,
                "prazo_cancelamento_dias": 7,
                "descricao": "Pacote para grupos.",
                "itens_inclusos": "Hospedagem",
            },
        ],
    )


def test_listagem_sem_filtros_retorna_todas(client, excursoes_semeadas):
    resp = client.get("/api/excursoes")
    assert resp.status_code == 200
    assert len(resp.json()) == 3


def test_listagem_filtro_destino_parcial(client, excursoes_semeadas):
    """Filtro por destino deve buscar parcialmente e sem diferenciar maiúsculas."""
    resp = client.get("/api/excursoes", params={"destino": "caldas"})
    assert resp.status_code == 200
    destinos = [e["destino"] for e in resp.json()]
    assert destinos == ["Caldas Novas", "Caldas Novas"]


def test_listagem_filtro_faixa_de_preco(client, excursoes_semeadas):
    resp = client.get("/api/excursoes", params={"preco_min": 200, "preco_max": 1000})
    assert resp.status_code == 200
    precos = sorted(e["preco"] for e in resp.json())
    # Exclui a de 179 e mantém as de 210 e 950.
    assert precos == [210.0, 950.0]


def test_listagem_filtro_data_inicio(client, excursoes_semeadas):
    """Apenas excursões com data de saída a partir de data_inicio."""
    resp = client.get("/api/excursoes", params={"data_inicio": "2026-12-15"})
    assert resp.status_code == 200
    saidas = sorted(e["data_saida"] for e in resp.json())
    assert saidas == ["2027-01-20", "2027-03-05"]


def test_listagem_filtros_combinados(client, excursoes_semeadas):
    """Destino + faixa de preço ao mesmo tempo."""
    resp = client.get("/api/excursoes", params={"destino": "caldas", "preco_min": 200})
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["id"] == 3


def test_detalhes_da_excursao(client, excursoes_semeadas):
    resp = client.get("/api/excursoes/2")
    assert resp.status_code == 200
    assert resp.json()["destino"] == "Porto de Galinhas"
    assert resp.json()["preco"] == 950.0


def test_detalhes_da_excursao_inexistente_retorna_404(client, excursoes_semeadas):
    resp = client.get("/api/excursoes/999")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Excursao nao encontrada"


def test_reserva_rejeita_overbooking(client, fake_supabase, cliente_token):
    """Excursão sem vagas suficientes deve rejeitar a reserva (RF05 / seção 6.6)."""
    fake_supabase.seed(
        "excursao",
        [
            {
                "id": 10,
                "nome": "Pipa - Sol e Mar",
                "destino": "Pipa",
                "data_saida": "2027-06-01",
                "data_retorno": "2027-06-06",
                "preco": 800.0,
                "vagas_totais": 2,
                "vagas_disponiveis": 2,
                "prazo_cancelamento_dias": 5,
                "descricao": "Pacote com resort.",
                "itens_inclusos": "Hospedagem",
            }
        ],
    )
    passageiros = [
        {"nome": f"Passageiro {i}", "cpf": f"{i:011d}", "data_nascimento": "1990-01-01"}
        for i in range(5)
    ]
    resp = client.post(
        "/api/reservas",
        json={"id_excursao": 10, "qtd_vagas": 5, "passageiros": passageiros},
        headers={"Authorization": f"Bearer {cliente_token}"},
    )
    assert resp.status_code == 409
    assert "insuficiente" in resp.json()["detail"].lower()

# ===========================================================================
# IMF TURISMO — testes de excursões (RF02, seção 3.1 do PRODUCT.md)
# Cobre a listagem com filtros (destino, data, faixa de preço), a ocultação
# de excursões encerradas, os detalhes de uma excursão e a rejeição de
# overbooking na criação de reserva.
# ===========================================================================

from datetime import date, timedelta

import pytest

from app.services import excursao_service

# Datas relativas mantêm a suíte válida ao longo do tempo (sem "bomba-relógio").
HOJE = date.today()


def _excursao(id_excursao: int, data_ida: date, data_volta: date) -> dict:
    """Excursão mínima para os testes de filtro por data."""
    return {
        "id_excursao": id_excursao,
        "id_admin": 1,
        "nome_excursao": f"Excursao {id_excursao}",
        "destino": "Caldas Novas",
        "data_ida": data_ida.isoformat(),
        "data_volta": data_volta.isoformat(),
        "valor_pessoa": 100.0,
        "vagas_totais": 10,
        "vagas_disponiveis": 10,
        "prazo_cancelamento_dias": 7,
        "descricao_roteiro": "Roteiro de teste.",
        "itens_inclusos": "Hospedagem",
    }


@pytest.fixture()
def excursoes_semeadas(fake_supabase):
    """Base de excursões usada nos testes de listagem e filtros."""
    fake_supabase.seed(
        "excursao",
        [
            {
                "id_excursao": 1,
                "id_admin": 1,
                "nome_excursao": "Caldas Novas - Ferias",
                "destino": "Caldas Novas",
                "data_ida": (HOJE + timedelta(days=30)).isoformat(),
                "data_volta": (HOJE + timedelta(days=34)).isoformat(),
                "valor_pessoa": 179.0,
                "vagas_totais": 30,
                "vagas_disponiveis": 20,
                "prazo_cancelamento_dias": 7,
                "descricao_roteiro": "Pacote com hospedagem e parque aquatico.",
                "itens_inclusos": "Hospedagem, cafe da manha",
            },
            {
                "id_excursao": 2,
                "id_admin": 1,
                "nome_excursao": "Porto de Galinhas - Praia",
                "destino": "Porto de Galinhas",
                "data_ida": (HOJE + timedelta(days=60)).isoformat(),
                "data_volta": (HOJE + timedelta(days=67)).isoformat(),
                "valor_pessoa": 950.0,
                "vagas_totais": 10,
                "vagas_disponiveis": 10,
                "prazo_cancelamento_dias": 15,
                "descricao_roteiro": "Pacote com piscinas naturais.",
                "itens_inclusos": "Hospedagem, passeios",
            },
            {
                "id_excursao": 3,
                "id_admin": 1,
                "nome_excursao": "Caldas Novas - Aniversario",
                "destino": "Caldas Novas",
                "data_ida": (HOJE + timedelta(days=90)).isoformat(),
                "data_volta": (HOJE + timedelta(days=94)).isoformat(),
                "valor_pessoa": 210.0,
                "vagas_totais": 15,
                "vagas_disponiveis": 15,
                "prazo_cancelamento_dias": 7,
                "descricao_roteiro": "Pacote para grupos.",
                "itens_inclusos": "Hospedagem",
            },
        ],
    )


def test_listagem_sem_filtros_retorna_futuras(client, excursoes_semeadas):
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
    precos = sorted(e["valor_pessoa"] for e in resp.json())
    # Exclui a de 179 e mantém as de 210 e 950.
    assert precos == [210.0, 950.0]


def test_listagem_filtro_data_inicio(client, excursoes_semeadas):
    """Apenas excursões com data de ida a partir de data_inicio."""
    data_inicio = (HOJE + timedelta(days=40)).isoformat()
    resp = client.get("/api/excursoes", params={"data_inicio": data_inicio})
    assert resp.status_code == 200
    saidas = sorted(e["data_ida"] for e in resp.json())
    assert saidas == [
        (HOJE + timedelta(days=60)).isoformat(),
        (HOJE + timedelta(days=90)).isoformat(),
    ]


def test_listagem_filtros_combinados(client, excursoes_semeadas):
    """Destino + faixa de preço ao mesmo tempo."""
    resp = client.get("/api/excursoes", params={"destino": "caldas", "preco_min": 200})
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["id_excursao"] == 3


def test_listagem_oculta_excursao_encerrada(client, fake_supabase):
    """Excursão cuja data_volta já passou não aparece para os clientes."""
    fake_supabase.seed(
        "excursao",
        [
            _excursao(20, HOJE - timedelta(days=10), HOJE - timedelta(days=6)),
            _excursao(21, HOJE + timedelta(days=10), HOJE + timedelta(days=14)),
        ],
    )

    resp = client.get("/api/excursoes")

    assert resp.status_code == 200
    assert [e["id_excursao"] for e in resp.json()] == [21]


def test_listagem_mantem_excursao_que_termina_hoje(fake_supabase):
    """No último dia (data_volta == hoje) a excursão ainda aparece."""
    hoje = date(2026, 10, 23)
    fake_supabase.seed(
        "excursao",
        [
            _excursao(30, hoje - timedelta(days=2), hoje),
            _excursao(31, hoje - timedelta(days=3), hoje - timedelta(days=1)),
            _excursao(32, hoje, hoje + timedelta(days=2)),
        ],
    )

    ids = [e["id_excursao"] for e in excursao_service.listar_excursoes(hoje=hoje)]

    assert ids == [30, 32]


def test_detalhes_da_excursao(client, excursoes_semeadas):
    resp = client.get("/api/excursoes/2")
    assert resp.status_code == 200
    assert resp.json()["destino"] == "Porto de Galinhas"
    assert resp.json()["valor_pessoa"] == 950.0


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
                "id_excursao": 10,
                "id_admin": 1,
                "nome_excursao": "Pipa - Sol e Mar",
                "destino": "Pipa",
                "data_ida": (HOJE + timedelta(days=30)).isoformat(),
                "data_volta": (HOJE + timedelta(days=35)).isoformat(),
                "valor_pessoa": 800.0,
                "vagas_totais": 2,
                "vagas_disponiveis": 2,
                "prazo_cancelamento_dias": 5,
                "descricao_roteiro": "Pacote com resort.",
                "itens_inclusos": "Hospedagem",
            }
        ],
    )
    passageiros = [
        {
            "nome_passageiro": f"Passageiro {i}",
            "cpf": ["12345678909", "52998224725", "11144477735", "98765432100", "39053344705"][i],
            "data_nascimento": "1990-01-01",
        }
        for i in range(5)
    ]
    resp = client.post(
        "/api/reservas",
        json={"id_excursao": 10, "qtd_vagas": 5, "passageiros": passageiros},
        headers={"Authorization": f"Bearer {cliente_token}"},
    )
    assert resp.status_code == 409
    assert "insuficiente" in resp.json()["detail"].lower()

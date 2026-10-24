# ===========================================================================
# IMF TURISMO — testes da validação de CPF (RF03/RF04)
# Cobre o cálculo dos dígitos verificadores (módulo 11) e a aplicação dele
# nos schemas de cadastro e de passageiro da reserva.
# ===========================================================================

import pytest

from app.core.validacao import cpf_valido, normalizar_cpf

DADOS_CADASTRO = {
    "nome": "Maria Silva",
    "cpf": "123.456.789-09",
    "email": "maria@teste.com",
    "telefone": "(61) 99999-0000",
    "cep": "72876-123",
    "logradouro": "Quadra M Lote 22",
    "numero": "22",
    "complemento": "Casa 2",
    "bairro": "Parque Esplanada 1",
    "cidade": "Valparaíso de Goiás",
    "uf": "go",
    "senha": "segredo123",
    "confirmar_senha": "segredo123",
}


# ---------------------------------------------------------------------------
# Cálculo dos dígitos verificadores
# ---------------------------------------------------------------------------
@pytest.mark.parametrize(
    "cpf",
    [
        "123.456.789-09",  # com máscara
        "12345678909",  # sem máscara
        "529.982.247-25",
        "111.444.777-35",
        "987.654.321-00",
    ],
)
def test_cpf_valido_aceita_cpfs_corretos(cpf):
    assert cpf_valido(cpf) is True


@pytest.mark.parametrize(
    "cpf",
    [
        "123.456.789-00",  # dígito verificador errado
        "529.982.247-24",  # segundo dígito errado
        "111.111.111-11",  # sequência repetida (passa no cálculo, mas não existe)
        "00000000000",
        "99999999999",
        "1234567890",  # 10 dígitos
        "123456789012",  # 12 dígitos
        "abcdefghijk",  # sem dígitos
        "",
        None,
    ],
)
def test_cpf_valido_rejeita_cpfs_incorretos(cpf):
    assert cpf_valido(cpf) is False


def test_normalizar_cpf_remove_mascara():
    assert normalizar_cpf("123.456.789-09") == "12345678909"
    assert normalizar_cpf(" 123 456 789 09 ") == "12345678909"
    assert normalizar_cpf(None) == ""


# ---------------------------------------------------------------------------
# Aplicação nos endpoints
# ---------------------------------------------------------------------------
def test_cadastro_aceita_cpf_valido(client):
    resp = client.post("/api/cadastro", json=DADOS_CADASTRO)
    assert resp.status_code == 201


def test_cadastro_rejeita_cpf_com_digito_verificador_errado(client):
    dados = dict(DADOS_CADASTRO)
    dados["cpf"] = "123.456.789-00"
    resp = client.post("/api/cadastro", json=dados)
    assert resp.status_code == 422
    assert "cpf" in resp.text.lower()


def test_cadastro_rejeita_cpf_com_todos_os_digitos_iguais(client):
    dados = dict(DADOS_CADASTRO)
    dados["cpf"] = "111.111.111-11"
    resp = client.post("/api/cadastro", json=dados)
    assert resp.status_code == 422

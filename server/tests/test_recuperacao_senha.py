# ===========================================================================
# IMF TURISMO — testes da recuperação de senha (seção 3.3 do PRODUCT.md)
# Cobre o fluxo "Esqueci minha senha": solicitação do link, troca de senha
# com token de uso único e as proteções contra token inválido, reutilizado
# ou de sessão.
# ===========================================================================

from urllib.parse import parse_qs, urlparse

import bcrypt
import pytest

from app.config import settings
from app.core import email

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
    "aceite_privacidade": True,
}

NOVA_SENHA = "novaSenha456"


def _extrair_token(link: str) -> str:
    """Lê o parâmetro `token` da URL enviada por e-mail."""
    return parse_qs(urlparse(link).query)["token"][0]


def _cadastrar(client) -> None:
    resp = client.post("/api/cadastro", json=DADOS_CADASTRO)
    assert resp.status_code == 201


def _solicitar_link(client, links_enviados) -> str:
    """Solicita a redefinição e devolve o token capturado."""
    resp = client.post("/api/esqueci-senha", json={"email": DADOS_CADASTRO["email"]})
    assert resp.status_code == 202
    assert len(links_enviados) == 1
    return _extrair_token(links_enviados[0]["link"])


@pytest.fixture()
def links_enviados(monkeypatch):
    """Substitui o envio de e-mail por uma lista em memória."""
    capturados: list[dict] = []

    def _capturar(destino, nome, link):
        capturados.append({"destino": destino, "nome": nome, "link": link})

    monkeypatch.setattr(email, "enviar_link_reset", _capturar)
    return capturados


# ---------------------------------------------------------------------------
# Solicitação do link
# ---------------------------------------------------------------------------
def test_esqueci_senha_com_email_cadastrado_envia_link(client, links_enviados):
    _cadastrar(client)
    resp = client.post("/api/esqueci-senha", json={"email": DADOS_CADASTRO["email"]})

    assert resp.status_code == 202
    # O e-mail sai com o link contendo o token de redefinição.
    assert len(links_enviados) == 1
    assert links_enviados[0]["destino"] == DADOS_CADASTRO["email"]
    assert "token=" in links_enviados[0]["link"]


def test_esqueci_senha_com_email_desconhecido_nao_revela_e_nao_envia(client, links_enviados):
    _cadastrar(client)
    resp_conhecido = client.post("/api/esqueci-senha", json={"email": DADOS_CADASTRO["email"]})
    resp_desconhecido = client.post("/api/esqueci-senha", json={"email": "ninguem@teste.com"})

    # Mesmo status e mesma mensagem: não vaza quais e-mails existem no banco.
    assert resp_desconhecido.status_code == resp_conhecido.status_code == 202
    assert resp_desconhecido.json() == resp_conhecido.json()
    # Apenas o e-mail cadastrado gera envio.
    assert len(links_enviados) == 1


def test_esqueci_senha_rejeita_email_invalido(client):
    resp = client.post("/api/esqueci-senha", json={"email": "nao-e-email"})
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Redefinição com token válido
# ---------------------------------------------------------------------------
def test_redefinir_senha_com_token_valido_troca_a_senha(client, links_enviados):
    _cadastrar(client)
    token = _solicitar_link(client, links_enviados)

    resp = client.post(
        "/api/redefinir-senha",
        json={"token": token, "senha": NOVA_SENHA, "confirmar_senha": NOVA_SENHA},
    )
    assert resp.status_code == 200

    # A senha antiga deixa de funcionar e a nova passa a autenticar.
    antiga = client.post(
        "/api/login", json={"email": DADOS_CADASTRO["email"], "senha": DADOS_CADASTRO["senha"]}
    )
    assert antiga.status_code == 401

    nova = client.post(
        "/api/login", json={"email": DADOS_CADASTRO["email"], "senha": NOVA_SENHA}
    )
    assert nova.status_code == 200
    assert nova.json()["access_token"]


def test_redefinir_senha_grava_hash_novo_e_nunca_texto_puro(client, links_enviados, fake_supabase):
    _cadastrar(client)
    token = _solicitar_link(client, links_enviados)
    client.post(
        "/api/redefinir-senha",
        json={"token": token, "senha": NOVA_SENHA, "confirmar_senha": NOVA_SENHA},
    )

    cliente = fake_supabase.table("cliente").select("*").execute().data[0]
    assert cliente["senha_hash"] != NOVA_SENHA
    assert cliente["senha_hash"].startswith("$2b$")
    assert bcrypt.checkpw(NOVA_SENHA.encode(), cliente["senha_hash"].encode())


# ---------------------------------------------------------------------------
# Proteções do token
# ---------------------------------------------------------------------------
def test_redefinir_senha_com_token_invalido_retorna_400(client):
    resp = client.post(
        "/api/redefinir-senha",
        json={"token": "token-invalido", "senha": NOVA_SENHA, "confirmar_senha": NOVA_SENHA},
    )
    assert resp.status_code == 400


def test_redefinir_senha_recusa_token_de_sessao(client, cliente_token):
    """Um JWT de sessão não pode ser usado para trocar a senha."""
    resp = client.post(
        "/api/redefinir-senha",
        json={"token": cliente_token, "senha": NOVA_SENHA, "confirmar_senha": NOVA_SENHA},
    )
    assert resp.status_code == 400


def test_redefinir_senha_recusa_token_expirado(client, links_enviados, monkeypatch):
    _cadastrar(client)

    # Gera o token já com validade negativa para simular a expiração.
    monkeypatch.setattr(settings, "reset_token_expire_minutes", -1)
    resp_solicitacao = client.post("/api/esqueci-senha", json={"email": DADOS_CADASTRO["email"]})
    assert resp_solicitacao.status_code == 202
    token_expirado = _extrair_token(links_enviados[-1]["link"])

    resp = client.post(
        "/api/redefinir-senha",
        json={"token": token_expirado, "senha": NOVA_SENHA, "confirmar_senha": NOVA_SENHA},
    )
    assert resp.status_code == 400


def test_redefinir_senha_nao_permite_reutilizar_o_token(client, links_enviados):
    _cadastrar(client)
    token = _solicitar_link(client, links_enviados)
    payload = {"token": token, "senha": NOVA_SENHA, "confirmar_senha": NOVA_SENHA}

    assert client.post("/api/redefinir-senha", json=payload).status_code == 200
    # Depois de trocar a senha, o hash muda e o token perde a validade.
    assert client.post("/api/redefinir-senha", json=payload).status_code == 400


def test_redefinir_senha_rejeita_confirmacao_divergente(client, links_enviados):
    _cadastrar(client)
    token = _solicitar_link(client, links_enviados)

    resp = client.post(
        "/api/redefinir-senha",
        json={"token": token, "senha": NOVA_SENHA, "confirmar_senha": "outraSenha789"},
    )
    assert resp.status_code == 422

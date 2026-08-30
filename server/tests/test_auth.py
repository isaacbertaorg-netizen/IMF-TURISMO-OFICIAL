# ===========================================================================
# IMF TURISMO — testes de autenticação e controle de acesso (seção 6.2)
# Cobre cadastro/login via Supabase Auth e as regras de proteção das rotas:
# 401 sem token válido e 403 para rotas /api/admin/* sem role ADMIN.
# ===========================================================================

DADOS_CADASTRO = {
    "nome": "Maria Silva",
    "cpf": "123.456.789-01",
    "email": "maria@teste.com",
    "telefone": "(61) 99999-0000",
    "endereco": "SQN 302, Bloco A - Brasilia/DF",
    "senha": "segredo123",
    "confirmar_senha": "segredo123",
}


def test_cadastro_cria_cliente_e_auth_user(client, fake_supabase):
    resp = client.post("/api/cadastro", json=DADOS_CADASTRO)
    assert resp.status_code == 201
    assert resp.json()["email"] == "maria@teste.com"

    # Deve existir linha em cliente vinculada ao auth.user recém-criado.
    clientes = fake_supabase.table("cliente").select("*").execute().data
    assert len(clientes) == 1
    assert clientes[0]["id_auth_user"].startswith("auth-")

    # O CPF deve estar normalizado (apenas dígitos) na gravação.
    assert clientes[0]["cpf"] == "12345678901"


def test_cadastro_rejeita_senhas_divergentes(client):
    dados = dict(DADOS_CADASTRO)
    dados["confirmar_senha"] = "outra123"
    resp = client.post("/api/cadastro", json=dados)
    assert resp.status_code == 422


def test_cadastro_rejeita_cpf_invalido(client):
    dados = dict(DADOS_CADASTRO)
    dados["cpf"] = "12345"
    resp = client.post("/api/cadastro", json=dados)
    assert resp.status_code == 422


def test_cadastro_rejeita_email_duplicado(client):
    client.post("/api/cadastro", json=DADOS_CADASTRO)
    resp = client.post("/api/cadastro", json=DADOS_CADASTRO)
    assert resp.status_code == 409
    assert "cadastrado" in resp.json()["detail"].lower()


def test_login_retorna_token(client):
    client.post("/api/cadastro", json=DADOS_CADASTRO)
    resp = client.post("/api/login", json={"email": "maria@teste.com", "senha": "segredo123"})
    assert resp.status_code == 200
    assert resp.json()["access_token"]


def test_login_com_senha_errada_retorna_401(client):
    client.post("/api/cadastro", json=DADOS_CADASTRO)
    resp = client.post("/api/login", json={"email": "maria@teste.com", "senha": "errada123"})
    assert resp.status_code == 401


def test_rota_protegida_sem_token_retorna_401(client, fake_supabase):
    resp = client.get("/api/reservas/minhas")
    assert resp.status_code == 401

    resp = client.post(
        "/api/reservas",
        json={"id_excursao": 1, "qtd_vagas": 1, "passageiros": []},
    )
    assert resp.status_code == 401


def test_rota_admin_sem_token_retorna_401(client):
    resp = client.get("/api/admin/dashboard")
    assert resp.status_code == 401


def test_rota_admin_com_token_de_cliente_retorna_403(client, fake_supabase, cliente_token):
    """Usuário válido no Supabase, mas sem role ADMIN, não acessa /api/admin/*."""
    resp = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {cliente_token}"})
    assert resp.status_code == 403
    assert "administradores" in resp.json()["detail"].lower()

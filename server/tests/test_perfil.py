# ===========================================================================
# IMF TURISMO — testes de perfil do cliente (seção 3.6 do PRODUCT.md)
# Cobre leitura dos dados cadastrais (sem senha), edição dos campos
# permitidos e a imutabilidade de CPF/e-mail (chave de identificação).
# ===========================================================================


def test_perfil_retorna_dados_sem_senha(client, cliente_token):
    resp = client.get("/api/perfil", headers={"Authorization": f"Bearer {cliente_token}"})

    assert resp.status_code == 200
    perfil = resp.json()
    assert perfil["nome_cliente"] == "Cliente Teste"
    assert perfil["email"] == "cliente@teste.com"
    # A credencial nunca sai da API (seção 6.3).
    assert "senha_hash" not in perfil


def test_perfil_exige_autenticacao(client):
    resp = client.get("/api/perfil")

    assert resp.status_code == 401


def test_perfil_atualiza_campos_permitidos(client, fake_supabase, cliente_token):
    resp = client.put(
        "/api/perfil",
        json={
            "nome": "Novo Nome",
            "telefone": "+55 (61) 98888-8888",
            "cep": "72876-100",
            "logradouro": "Rua Nova",
            "numero": "45",
            "bairro": "Centro",
            "cidade": "Valparaíso de Goiás",
            "uf": "go",
        },
        headers={"Authorization": f"Bearer {cliente_token}"},
    )

    assert resp.status_code == 200
    assert resp.json()["nome_cliente"] == "Novo Nome"
    assert resp.json()["telefone"] == "+55 (61) 98888-8888"
    assert resp.json()["cep"] == "72876100"
    assert resp.json()["uf"] == "GO"

    linha = (
        fake_supabase.table("cliente")
        .select("*")
        .eq("id_cliente", 1)
        .maybe_single()
        .execute()
        .data
    )
    assert linha["nome_cliente"] == "Novo Nome"
    assert linha["cidade"] == "Valparaíso de Goiás"


def test_perfil_ignora_cpf_e_email(client, fake_supabase, cliente_token):
    """CPF e e-mail são imutáveis: mesmo enviados, não são alterados."""
    resp = client.put(
        "/api/perfil",
        json={"nome": "Mantém Nome", "cpf": "99999999999", "email": "troca@teste.com"},
        headers={"Authorization": f"Bearer {cliente_token}"},
    )

    assert resp.status_code == 200
    assert resp.json()["email"] == "cliente@teste.com"

    linha = (
        fake_supabase.table("cliente")
        .select("*")
        .eq("id_cliente", 1)
        .maybe_single()
        .execute()
        .data
    )
    assert linha["cpf"] == "12345678901"
    assert linha["email"] == "cliente@teste.com"

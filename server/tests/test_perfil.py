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
    assert linha["cpf"] == "12345678909"
    assert linha["email"] == "cliente@teste.com"


def test_perfil_registra_consentimentos_e_permite_revogar(
    client, fake_supabase, cliente_token
):
    headers = {"Authorization": f"Bearer {cliente_token}"}

    resp = client.put(
        "/api/perfil/consentimentos",
        json={
            "aceite_privacidade": True,
            "consentimento_imagem": True,
            "consentimento_marketing": True,
            "consentimento_compartilhamento": True,
        },
        headers=headers,
    )

    assert resp.status_code == 200
    perfil = resp.json()
    assert perfil["aceite_privacidade"] is True
    assert perfil["aceite_privacidade_versao"] == "1.0"
    assert perfil["consentimento_imagem"] is True
    assert perfil["consentimento_marketing"] is True
    assert perfil["consentimento_compartilhamento"] is True
    assert perfil["consentimentos_versao"] == "1.0"
    assert perfil["consentimento_imagem_em"]

    # Revogar o marketing mantém a data da última mudança, mas desliga a flag.
    resp = client.put(
        "/api/perfil/consentimentos",
        json={
            "aceite_privacidade": True,
            "consentimento_imagem": True,
            "consentimento_marketing": False,
            "consentimento_compartilhamento": True,
        },
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["consentimento_marketing"] is False
    assert resp.json()["consentimento_marketing_em"]


def test_perfil_exige_aceite_da_politica(client, cliente_token):
    resp = client.put(
        "/api/perfil/consentimentos",
        json={"aceite_privacidade": False},
        headers={"Authorization": f"Bearer {cliente_token}"},
    )

    assert resp.status_code == 400
    assert "Política de Privacidade" in resp.json()["detail"]


def test_perfil_envia_e_remove_foto(client, fake_supabase, cliente_token, monkeypatch):
    from app.core import storage

    chamadas = {}

    def fake_salvar(conteudo, content_type, pasta="excursoes", bucket=None):
        chamadas["pasta"] = pasta
        chamadas["bucket"] = bucket
        return "https://exemplo/storage/v1/object/public/perfil-imagens/perfis/1/foto.png"

    monkeypatch.setattr(storage, "salvar_imagem", fake_salvar)
    monkeypatch.setattr(storage, "remover_imagem", lambda *args, **kwargs: None)
    headers = {"Authorization": f"Bearer {cliente_token}"}

    resp = client.post(
        "/api/perfil/foto",
        files={"arquivo": ("foto.png", b"\x89PNG\r\n\x1a\nconteudo", "image/png")},
        headers=headers,
    )

    assert resp.status_code == 200
    assert resp.json()["foto_perfil_url"].endswith("/perfis/1/foto.png")
    # O upload vai para a pasta do próprio cliente e para o bucket de perfil.
    assert chamadas == {"pasta": "perfis/1", "bucket": "perfil-imagens"}

    linha = (
        fake_supabase.table("cliente")
        .select("*")
        .eq("id_cliente", 1)
        .maybe_single()
        .execute()
        .data
    )
    assert linha["foto_perfil_url"].endswith("/perfis/1/foto.png")

    resp = client.delete("/api/perfil/foto", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["foto_perfil_url"] is None


def test_perfil_foto_exige_autenticacao(client):
    resp = client.post(
        "/api/perfil/foto",
        files={"arquivo": ("foto.png", b"\x89PNG\r\n\x1a\nconteudo", "image/png")},
    )
    assert resp.status_code == 401

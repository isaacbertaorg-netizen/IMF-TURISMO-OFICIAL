# ===========================================================================
# IMF TURISMO — testes do upload de imagens das excursões
# Cobre a validação do arquivo (tipo, conteúdo e tamanho) e a rota
# administrativa que devolve a URL pública do Supabase Storage.
# ===========================================================================

import pytest
from storage3.exceptions import StorageApiError

from app.core import storage
from app.core.exceptions import ArquivoInvalidoError

# Assinaturas mínimas válidas (o serviço confere os magic bytes).
PNG_MINIMO = b"\x89PNG\r\n\x1a\n" + b"conteudo-de-teste"
JPEG_MINIMO = b"\xff\xd8\xff" + b"conteudo-de-teste"


@pytest.fixture()
def headers_admin(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


def test_extensao_aceita_png_e_jpeg():
    assert storage._extensao(PNG_MINIMO, "image/png") == "png"
    assert storage._extensao(JPEG_MINIMO, "image/jpeg") == "jpg"


def test_extensao_rejeita_tipo_nao_imagem():
    with pytest.raises(ArquivoInvalidoError):
        storage._extensao(b"<html>", "text/html")


def test_extensao_rejeita_conteudo_disfarcado():
    # Content-Type diz PNG, mas o conteúdo é HTML (evita XSS em URL pública).
    with pytest.raises(ArquivoInvalidoError):
        storage._extensao(b"<html>", "image/png")


def test_salvar_imagem_rejeita_arquivo_grande(monkeypatch):
    monkeypatch.setattr(storage.settings, "max_imagem_mb", 1)

    with pytest.raises(ArquivoInvalidoError):
        storage.salvar_imagem(b"\x00" * (1024 * 1024 + 1), "image/png")


class _BucketAusente:
    """Simula o Storage real quando o bucket ainda não existe.

    A lib storage3 devolve o status como string ("404") em algumas versões;
    o teste fixa esse contrato para não voltar a quebrar o primeiro upload.
    """

    def __init__(self, status="404"):
        self.status = status
        self.criados: list[tuple[str, dict]] = []

    def get_bucket(self, nome):
        raise StorageApiError("Bucket not found", "Bucket not found", self.status)

    def create_bucket(self, nome, options=None):
        self.criados.append((nome, options or {}))


class _StorageFalso:
    def __init__(self, bucket):
        self._bucket = bucket

    def get_bucket(self, nome):
        return self._bucket.get_bucket(nome)

    def create_bucket(self, nome, options=None):
        return self._bucket.create_bucket(nome, options)


def _cliente_falso(bucket):
    class _Cliente:
        storage = _StorageFalso(bucket)

    return _Cliente()


def test_garantir_bucket_cria_quando_status_vem_como_texto(monkeypatch):
    # Regressão: o primeiro upload de perfil falhava porque o 404 chegava
    # como string e a comparação com o inteiro 404 não batia.
    bucket = _BucketAusente(status="404")
    monkeypatch.setattr(storage.supabase, "get_supabase", lambda: _cliente_falso(bucket))

    storage._garantir_bucket("perfil-imagens")

    assert bucket.criados == [("perfil-imagens", {"public": True})]


def test_garantir_bucket_propaga_erro_que_nao_e_404(monkeypatch):
    bucket = _BucketAusente(status="403")
    monkeypatch.setattr(storage.supabase, "get_supabase", lambda: _cliente_falso(bucket))

    with pytest.raises(StorageApiError):
        storage._garantir_bucket("perfil-imagens")

    assert bucket.criados == []


def test_upload_exige_admin(client, cliente_token):
    resp = client.post(
        "/api/admin/excursoes/imagem",
        files={"arquivo": ("foto.png", PNG_MINIMO, "image/png")},
        headers={"Authorization": f"Bearer {cliente_token}"},
    )

    assert resp.status_code == 403


def test_upload_devolve_url_publica(client, headers_admin, monkeypatch):
    # Não toca no Supabase real: valida o contrato da rota.
    monkeypatch.setattr(
        storage,
        "salvar_imagem",
        lambda conteudo, content_type: "https://exemplo.com/excursoes/foto.png",
    )

    resp = client.post(
        "/api/admin/excursoes/imagem",
        files={"arquivo": ("foto.png", PNG_MINIMO, "image/png")},
        headers=headers_admin,
    )

    assert resp.status_code == 200
    assert resp.json()["imagem_url"].endswith("foto.png")


def test_upload_rejeita_tipo_invalido(client, headers_admin):
    # A validação acontece antes de qualquer chamada ao Storage.
    resp = client.post(
        "/api/admin/excursoes/imagem",
        files={"arquivo": ("arquivo.html", b"<html></html>", "text/html")},
        headers=headers_admin,
    )

    assert resp.status_code == 400
    assert "imagem" in resp.json()["detail"].lower()

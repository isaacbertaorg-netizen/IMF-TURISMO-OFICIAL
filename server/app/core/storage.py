# ===========================================================================
# IMF TURISMO — upload de imagens para o Supabase Storage
# O front envia o arquivo para a API (que guarda a chave de serviço); a API
# sobe para um bucket público e devolve a URL gravada em excursao.imagem_url.
# Assim a chave do Supabase nunca chega ao navegador (seção 6.3).
# ===========================================================================

import uuid
from typing import Final

from storage3.exceptions import StorageApiError

from app.config import settings
from app.core import supabase
from app.core.exceptions import ArquivoInvalidoError

# Formatos aceitos e a assinatura (magic bytes) de cada um. Conferir o
# conteúdo — e não só o Content-Type informado — evita subir HTML/SVG
# disfarçado de imagem para uma URL pública (XSS).
TIPOS_ACEITOS: Final = {
    "image/jpeg": (b"\xff\xd8\xff", "jpg"),
    "image/png": (b"\x89PNG\r\n\x1a\n", "png"),
    "image/webp": (b"RIFF", "webp"),
}


def _extensao(conteudo: bytes, content_type: str) -> str:
    """Confere o tipo declarado e a assinatura real do arquivo.

    Retorna a extensão usada no caminho do Storage.
    """
    tipo = (content_type or "").split(";")[0].strip().lower()
    assinatura = TIPOS_ACEITOS.get(tipo)
    if assinatura is None:
        raise ArquivoInvalidoError("Envie uma imagem JPG, PNG ou WebP")

    prefixo, extensao = assinatura
    if not conteudo.startswith(prefixo):
        raise ArquivoInvalidoError("O arquivo não parece ser uma imagem válida")

    # WebP é um container RIFF: além do prefixo, precisa ter "WEBP" no byte 8.
    if tipo == "image/webp" and conteudo[8:12] != b"WEBP":
        raise ArquivoInvalidoError("O arquivo não parece ser uma imagem válida")

    return extensao


def _garantir_bucket() -> None:
    """Cria o bucket público na primeira utilização (idempotente)."""
    cliente = supabase.get_supabase()
    try:
        cliente.storage.get_bucket(settings.storage_bucket)
        return
    except StorageApiError as erro:
        if erro.status != 404:
            raise

    try:
        cliente.storage.create_bucket(settings.storage_bucket, options={"public": True})
    except StorageApiError as erro_create:
        # Outra requisição pode ter criado o bucket entre o get e o create;
        # se ele existe agora, seguimos normalmente. Caso contrário, o erro
        # real da criação (permissão, nome etc.) é preservado.
        try:
            cliente.storage.get_bucket(settings.storage_bucket)
        except StorageApiError:
            raise erro_create from None


def salvar_imagem(conteudo: bytes, content_type: str) -> str:
    """Valida e envia a imagem; devolve a URL pública no Storage.

    Raises:
        ArquivoInvalidoError: arquivo vazio, grande demais ou que não é
            JPG/PNG/WebP de verdade.
    """
    if not conteudo:
        raise ArquivoInvalidoError("Arquivo vazio")

    limite = settings.max_imagem_mb * 1024 * 1024
    if len(conteudo) > limite:
        raise ArquivoInvalidoError(
            f"A imagem deve ter no máximo {settings.max_imagem_mb} MB"
        )

    extensao = _extensao(conteudo, content_type)
    _garantir_bucket()

    # Nome aleatório: evita colisão, sobrescrita e nomes vindos do usuário
    # (que poderiam conter caminhos como "../").
    caminho = f"excursoes/{uuid.uuid4().hex}.{extensao}"
    cliente = supabase.get_supabase()
    cliente.storage.from_(settings.storage_bucket).upload(
        caminho,
        conteudo,
        {"content-type": content_type, "upsert": "false"},
    )
    return cliente.storage.from_(settings.storage_bucket).get_public_url(caminho)

# ===========================================================================
# IMF TURISMO — serviço de perfil do cliente (seção 3.6 do PRODUCT.md)
# Leitura e edição dos dados cadastrais, da foto do avatar e das autorizações
# LGPD. CPF e e-mail nunca são alterados (chave de identificação) e
# senha_hash jamais sai da API.
# ===========================================================================

from datetime import datetime, timezone
from typing import Any

from app.config import settings
from app.core import storage, supabase
from app.core.exceptions import (
    ConsentimentoObrigatorioError,
    RecursoNaoEncontradoError,
)
from app.core.lgpd import VERSAO_CONSENTIMENTOS, VERSAO_POLITICA_PRIVACIDADE

# Colunas públicas do perfil: tudo de `cliente` exceto a credencial.
_COLUNAS_PERFIL = (
    "id_cliente, nome_cliente, cpf, email, telefone, cep, logradouro, numero, "
    "complemento, bairro, cidade, uf, data_cadastro, foto_perfil_url, "
    "aceite_privacidade, aceite_privacidade_em, aceite_privacidade_versao, "
    "consentimento_imagem, consentimento_imagem_em, consentimento_marketing, "
    "consentimento_marketing_em, consentimento_compartilhamento, "
    "consentimento_compartilhamento_em, consentimentos_versao, "
    "consentimentos_atualizado_em"
)

# Mapeamento dos campos da API para as colunas da tabela.
_CAMPOS_EDITAVEIS = {
    "nome": "nome_cliente",
    "telefone": "telefone",
    "cep": "cep",
    "logradouro": "logradouro",
    "numero": "numero",
    "complemento": "complemento",
    "bairro": "bairro",
    "cidade": "cidade",
    "uf": "uf",
}

# Autorizações opcionais que possuem coluna de data da última mudança.
_CONSENTIMENTOS_OPCIONAIS = (
    "consentimento_imagem",
    "consentimento_marketing",
    "consentimento_compartilhamento",
)


def _agora() -> str:
    """Timestamp UTC em ISO 8601, formato aceito pelo Supabase."""
    return datetime.now(timezone.utc).isoformat()


def _atualizar_cliente(id_cliente: int, campos: dict[str, Any]) -> None:
    """Atualiza colunas do cliente e falha se o registro não existir."""
    atualizado = (
        supabase.get_supabase()
        .table("cliente")
        .update(campos)
        .eq("id_cliente", id_cliente)
        .execute()
        .data
    )
    if not atualizado:
        raise RecursoNaoEncontradoError("Cliente nao encontrado")


def obter_perfil(id_cliente: int) -> dict[str, Any]:
    """Retorna os dados cadastrais do cliente autenticado, sem a senha."""
    perfil = supabase.buscar_um(
        supabase.get_supabase()
        .table("cliente")
        .select(_COLUNAS_PERFIL)
        .eq("id_cliente", id_cliente)
    )
    if perfil is None:
        raise RecursoNaoEncontradoError("Cliente nao encontrado")
    return perfil


def atualizar_perfil(id_cliente: int, dados: dict[str, Any]) -> dict[str, Any]:
    """Atualiza nome, telefone e/ou endereço do cliente autenticado."""
    # Filtra apenas os campos presentes (None significa "não alterar").
    campos = {
        coluna: dados[campo]
        for campo, coluna in _CAMPOS_EDITAVEIS.items()
        if dados.get(campo) is not None
    }

    if campos:
        _atualizar_cliente(id_cliente, campos)

    return obter_perfil(id_cliente)


def atualizar_foto(id_cliente: int, url: str) -> dict[str, Any]:
    """Grava a nova foto e remove a anterior do Storage.

    A remoção é feita depois da atualização no banco: se o Storage falhar,
    o perfil já aponta para a foto nova e a limpeza pode ser tentada depois.
    """
    atual = obter_perfil(id_cliente)
    antiga = atual.get("foto_perfil_url")
    _atualizar_cliente(id_cliente, {"foto_perfil_url": url})
    if antiga and antiga != url:
        storage.remover_imagem(antiga, bucket=settings.storage_bucket_perfil)
    return obter_perfil(id_cliente)


def remover_foto(id_cliente: int) -> dict[str, Any]:
    """Remove a foto do perfil e apaga o arquivo do Storage."""
    atual = obter_perfil(id_cliente)
    antiga = atual.get("foto_perfil_url")
    _atualizar_cliente(id_cliente, {"foto_perfil_url": None})
    if antiga:
        storage.remover_imagem(antiga, bucket=settings.storage_bucket_perfil)
    return obter_perfil(id_cliente)


def atualizar_consentimentos(id_cliente: int, dados: dict[str, Any]) -> dict[str, Any]:
    """Registra o aceite da política e as autorizações opcionais.

    Cada autorização opcional guarda a data da última mudança (concessão ou
    revogação). O aceite da política é obrigatório e registra a versão do
    documento; se a versão mudar no futuro, um novo aceite é solicitado.

    Raises:
        ConsentimentoObrigatorioError: aceite da política ausente.
    """
    if not dados.get("aceite_privacidade"):
        raise ConsentimentoObrigatorioError()

    atual = obter_perfil(id_cliente)
    agora = _agora()
    campos: dict[str, Any] = {
        "consentimentos_versao": VERSAO_CONSENTIMENTOS,
        "consentimentos_atualizado_em": agora,
    }

    # O aceite da política é tratado separadamente: ele não é uma opção que
    # pode ser desligada no perfil, mas precisa ser renovado se a versão do
    # documento mudar.
    if (
        not atual.get("aceite_privacidade")
        or atual.get("aceite_privacidade_versao") != VERSAO_POLITICA_PRIVACIDADE
    ):
        campos["aceite_privacidade"] = True
        campos["aceite_privacidade_em"] = agora
        campos["aceite_privacidade_versao"] = VERSAO_POLITICA_PRIVACIDADE

    # Autorizações opcionais: só grava a data quando o estado realmente muda,
    # preservando a data original de quem já tinha autorizado.
    for campo in _CONSENTIMENTOS_OPCIONAIS:
        novo = bool(dados.get(campo))
        anterior = bool(atual.get(campo))
        if novo != anterior:
            campos[campo] = novo
            campos[f"{campo}_em"] = agora

    _atualizar_cliente(id_cliente, campos)
    return obter_perfil(id_cliente)

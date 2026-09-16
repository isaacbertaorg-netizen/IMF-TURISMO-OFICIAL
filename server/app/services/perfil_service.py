# ===========================================================================
# IMF TURISMO — serviço de perfil do cliente (seção 3.6 do PRODUCT.md)
# Leitura e edição dos dados cadastrais. CPF e e-mail nunca são alterados
# (chave de identificação) e senha_hash jamais sai da API.
# ===========================================================================

from typing import Any

from app.core import supabase
from app.core.exceptions import RecursoNaoEncontradoError

# Colunas públicas do perfil: tudo de `cliente` exceto a credencial.
_COLUNAS_PERFIL = (
    "id_cliente, nome_cliente, cpf, email, telefone, cep, logradouro, numero, "
    "complemento, bairro, cidade, uf, data_cadastro"
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

    return obter_perfil(id_cliente)

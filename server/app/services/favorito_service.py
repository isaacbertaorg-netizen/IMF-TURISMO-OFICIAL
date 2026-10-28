# ===========================================================================
# IMF TURISMO — favoritos do cliente
# O vínculo é sempre (id_cliente, id_excursao). O id_cliente vem do token,
# nunca do body. A listagem devolve a excursão completa para o front montar
# os cards sem uma segunda requisição.
# ===========================================================================

from typing import Any

from app.core import supabase
from app.core.exceptions import RecursoNaoEncontradoError
from app.services.excursao_service import obter_excursao


def _excursao_favorita(id_excursao: int) -> dict[str, Any]:
    """Busca a excursão e devolve com a marca de favorito."""
    excursao = obter_excursao(id_excursao)
    return {**excursao, "favorito": True}


def listar_favoritos(id_cliente: int) -> list[dict[str, Any]]:
    """Lista as excursões favoritadas pelo cliente, da mais recente à antiga."""
    linhas = (
        supabase.get_supabase()
        .table("favorito")
        .select("id_excursao")
        .eq("id_cliente", id_cliente)
        .order("criado_em", desc=True)
        .execute()
        .data
    )

    itens = []
    for linha in linhas:
        try:
            itens.append(_excursao_favorita(linha["id_excursao"]))
        except RecursoNaoEncontradoError:
            # Excursão removida entre a leitura e a montagem da lista: ignora.
            continue
    return itens


def adicionar_favorito(id_cliente: int, id_excursao: int) -> dict[str, Any]:
    """Favorita uma excursão. Repetir a operação é idempotente."""
    excursao = _excursao_favorita(id_excursao)

    existente = supabase.buscar_um(
        supabase.get_supabase()
        .table("favorito")
        .select("id_favorito")
        .eq("id_cliente", id_cliente)
        .eq("id_excursao", id_excursao)
    )
    if existente is not None:
        return excursao

    try:
        (
            supabase.get_supabase()
            .table("favorito")
            .insert({"id_cliente": id_cliente, "id_excursao": id_excursao})
            .execute()
        )
    except Exception:  # noqa: BLE001 - corrida entre duas requisições iguais
        # A UNIQUE (id_cliente, id_excursao) garante um único registro. Se
        # outra requisição inseriu antes, o resultado final é o mesmo. Se o
        # registro ainda não existir, o erro real é propagado.
        confirmado = supabase.buscar_um(
            supabase.get_supabase()
            .table("favorito")
            .select("id_favorito")
            .eq("id_cliente", id_cliente)
            .eq("id_excursao", id_excursao)
        )
        if confirmado is None:
            raise

    return excursao


def remover_favorito(id_cliente: int, id_excursao: int) -> dict[str, Any]:
    """Remove o favorito. Se ele não existir, também retorna sucesso."""
    (
        supabase.get_supabase()
        .table("favorito")
        .delete()
        .eq("id_cliente", id_cliente)
        .eq("id_excursao", id_excursao)
        .execute()
    )
    return {"mensagem": "Excursao removida dos favoritos.", "favorito": False}

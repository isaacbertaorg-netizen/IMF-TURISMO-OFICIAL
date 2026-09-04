# ===========================================================================
# IMF TURISMO — serviço administrativo (seções 3.8 a 3.11 do PRODUCT.md)
# Consultas/operações no banco. A autorização (get_current_admin) fica na
# camada de rotas. Colunas conforme o schema real.
# ===========================================================================

from typing import Any

from app.core import supabase
from app.core.exceptions import RecursoNaoEncontradoError


def dashboard() -> dict[str, int]:
    """Totais exibidos nos cards do painel (Imagem 6): reservas e clientes."""
    total_reservas = len(
        supabase.get_supabase().table("reserva").select("id_reserva").execute().data
    )
    total_clientes = len(
        supabase.get_supabase().table("cliente").select("id_cliente").execute().data
    )
    return {"total_reservas": total_reservas, "total_clientes": total_clientes}


def listar_excursoes() -> list[dict[str, Any]]:
    """Lista todas as excursões para a tela de gerenciamento (seção 3.9)."""
    return supabase.get_supabase().table("excursao").select("*").order("data_ida").execute().data


def criar_excursao(id_admin: int, dados: dict[str, Any]) -> dict[str, Any]:
    """Cadastra nova excursão vinculada ao admin autenticado.

    O id_admin vem do token (nunca do body). vagas_disponiveis nasce igual a
    vagas_totais (coluna NOT NULL, sem default no schema).
    """
    payload = dict(dados)
    payload["id_admin"] = id_admin
    payload["vagas_disponiveis"] = dados.get("vagas_totais", 0)
    return supabase.get_supabase().table("excursao").insert(payload).execute().data[0]


def atualizar_excursao(id_excursao: int, dados: dict[str, Any]) -> dict[str, Any]:
    """Atualiza campos informados de uma excursão existente."""
    excursao = (
        supabase.get_supabase()
        .table("excursao")
        .select("*")
        .eq("id_excursao", id_excursao)
        .maybe_single()
        .execute()
        .data
    )
    if excursao is None:
        raise RecursoNaoEncontradoError("Excursao nao encontrada")

    # Filtra apenas os campos presentes no payload (None significa "não alterar").
    campos = {k: v for k, v in dados.items() if v is not None}

    # Se alterar vagas_totais, recalcula as disponíveis para respeitar o CHECK
    # vagas_disponiveis <= vagas_totais: disponíveis = novas totais - já reservadas.
    if "vagas_totais" in campos:
        reservadas = excursao["vagas_totais"] - excursao["vagas_disponiveis"]
        campos["vagas_disponiveis"] = max(campos["vagas_totais"] - reservadas, 0)

    atualizada = (
        supabase.get_supabase()
        .table("excursao")
        .update(campos)
        .eq("id_excursao", id_excursao)
        .execute()
        .data[0]
    )
    return atualizada


def excluir_excursao(id_excursao: int) -> None:
    """Exclui uma excursão. Retorna 404 se ela não existir."""
    excluida = (
        supabase.get_supabase()
        .table("excursao")
        .delete()
        .eq("id_excursao", id_excursao)
        .execute()
        .data
    )
    if not excluida:
        raise RecursoNaoEncontradoError("Excursao nao encontrada")


def listar_reservas(status: str | None = None) -> list[dict[str, Any]]:
    """Lista reservas para o painel, com filtro opcional por status (seção 3.10)."""
    query = supabase.get_supabase().table("reserva").select("*").order("data_reserva", desc=True)
    if status:
        query = query.eq("status", status)
    return query.execute().data


def cancelar_reserva_manual(id_reserva: int) -> dict[str, Any]:
    """Cancelamento manual pelo admin (RF06) — sem regra de prazo, para
    situações excepcionais. O trigger do banco devolve as vagas."""
    from app.services.reserva_service import _cancelar_comum

    reserva = (
        supabase.get_supabase()
        .table("reserva")
        .select("*")
        .eq("id_reserva", id_reserva)
        .maybe_single()
        .execute()
        .data
    )
    if reserva is None:
        raise RecursoNaoEncontradoError("Reserva nao encontrada")

    return _cancelar_comum(reserva)


def listar_clientes() -> list[dict[str, Any]]:
    """Lista clientes para o painel (somente leitura, seção 3.11).

    Nunca expõe senha_hash — ela não deve sair da API.
    """
    return (
        supabase.get_supabase()
        .table("cliente")
        .select(
            "id_cliente, nome_cliente, cpf, email, telefone, cidade, uf, data_cadastro"
        )
        .order("nome_cliente")
        .execute()
        .data
    )

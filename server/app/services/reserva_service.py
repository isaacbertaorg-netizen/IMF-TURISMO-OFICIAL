# ===========================================================================
# IMF TURISMO — serviço de reservas
# Regras de negócio do fluxo de reserva:
#   - validação explícita de vagas antes do insert (seção 6.6, retorno amigável)
#   - cancelamento respeitando o prazo da excursão (prazo_cancelamento_dias, RF06)
#
# O schema real possui triggers (fn_checar_vagas / fn_atualizar_vagas) que
# mantêm vagas_disponiveis sincronizadas. Por isso, este serviço NÃO ajusta
# manualmente as vagas — apenas valida e altera o status, deixando o trigger
# do banco atualizar o estoque (evita dupla contagem).
# ===========================================================================

from datetime import date, datetime, timezone
from typing import Any

from app.core import supabase
from app.core.exceptions import (
    PrazoCancelamentoExpiradoError,
    RecursoNaoEncontradoError,
    ReservaJaCanceladaError,
    VagasInsuficientesError,
)
from app.services.excursao_service import obter_excursao


def criar_reserva(
    id_cliente: int,
    id_excursao: int,
    qtd_vagas: int,
    passageiros: list[dict[str, Any]],
) -> dict[str, Any]:
    """Cria uma reserva com status 'pendente'.

    Raises:
        VagasInsuficientesError: se a excursão não comportar a quantidade pedida.
    """
    excursao = obter_excursao(id_excursao)

    # Validação de overbooking na camada de aplicação (seção 6.6): mesmo com o
    # trigger no banco, validamos aqui para retornar erro amigável ao usuário.
    if excursao["vagas_disponiveis"] < qtd_vagas:
        raise VagasInsuficientesError(
            f"Vagas insuficientes. Disponiveis: {excursao['vagas_disponiveis']}"
        )

    # Reserva nasce 'pendente' até a confirmação de pagamento (seção 3.4).
    # data_reserva tem DEFAULT NOW() no banco; o trigger decrementa as vagas.
    reserva = (
        supabase.get_supabase()
        .table("reserva")
        .insert(
            {
                "id_cliente": id_cliente,
                "id_excursao": id_excursao,
                "qtd_vagas": qtd_vagas,
                "status": "pendente",
            }
        )
        .execute()
        .data[0]
    )

    # Registra um passageiro por vaga, vinculado à reserva recém-criada.
    if passageiros:
        supabase.get_supabase().table("passageiro").insert(
            [{"id_reserva": reserva["id_reserva"], **passageiro} for passageiro in passageiros]
        ).execute()

    return reserva


def listar_minhas(id_cliente: int) -> list[dict[str, Any]]:
    """Lista as reservas do cliente, enriquecidas com dados da excursão."""
    reservas = (
        supabase.get_supabase()
        .table("reserva")
        .select("*")
        .eq("id_cliente", id_cliente)
        .order("data_reserva", desc=True)
        .execute()
        .data
    )

    # Enriquece cada reserva com destino e nome da excursão para a listagem.
    for reserva in reservas:
        excursao = obter_excursao(reserva["id_excursao"])
        reserva["excursao_destino"] = excursao["destino"]
        reserva["excursao_nome"] = excursao["nome_excursao"]

    return reservas


def _cancelar_comum(reserva: dict[str, Any]) -> dict[str, Any]:
    """Marca a reserva como cancelada. O trigger do banco devolve as vagas.

    Comum ao cancelamento pelo cliente (com prazo) e pelo admin (manual).
    """
    supabase.get_supabase().table("reserva").update({"status": "cancelada"}).eq(
        "id_reserva", reserva["id_reserva"]
    ).execute()
    return reserva


def _prazo_de_cancelamento_ok(excursao: dict[str, Any], hoje: date) -> bool:
    """Verifica se ainda é possível cancelar dentro do prazo (RF06).

    Permitido enquanto a diferença entre data_ida e hoje for maior ou igual a
    prazo_cancelamento_dias da excursão.
    """
    data_ida = date.fromisoformat(excursao["data_ida"])
    prazo = excursao.get("prazo_cancelamento_dias") or 0
    return (data_ida - hoje).days >= prazo


def cancelar_reserva(id_cliente: int, id_reserva: int, hoje: date | None = None) -> dict[str, Any]:
    """Cancela uma reserva do cliente respeitando o prazo da excursão.

    Raises:
        RecursoNaoEncontradoError: reserva inexistente.
        PrazoCancelamentoExpiradoError: fora do prazo (o botão some no front,
            mas o back-end valida de novo — seção 3.5).
    """
    # `hoje` é injetável para permitir testes determinísticos de prazo.
    # Usa a data local (fuso do servidor), referência de negócio do prazo.
    hoje = hoje or datetime.now(timezone.utc).date()

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

    # Cliente só pode cancelar as próprias reservas (seção 6.2).
    if reserva["id_cliente"] != id_cliente:
        raise RecursoNaoEncontradoError("Reserva nao encontrada")

    if reserva["status"] == "cancelada":
        raise ReservaJaCanceladaError()

    excursao = obter_excursao(reserva["id_excursao"])

    if not _prazo_de_cancelamento_ok(excursao, hoje):
        raise PrazoCancelamentoExpiradoError()

    return _cancelar_comum(reserva)

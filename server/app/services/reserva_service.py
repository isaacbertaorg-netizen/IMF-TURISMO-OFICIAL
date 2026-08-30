# ===========================================================================
# IMF TURISMO — serviço de reservas
# Regras de negócio do fluxo de reserva:
#   - validação explícita de vagas antes do insert (seção 6.6 do PRODUCT.md,
#     não dependendo apenas do trigger do banco);
#   - cancelamento respeitando o prazo da excursão (prazo_cancelamento_dias,
#     RF06) e devolução das vagas ao estoque.
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
    """Cria uma reserva com status 'pendente' e devolve as vagas do estoque.

    Raises:
        VagasInsuficientesError: se a excursão não comportar a quantidade pedida.
    """
    excursao = obter_excursao(id_excursao)

    # Validação de overbooking na camada de aplicação (seção 6.6), antes de
    # qualquer insert — retorna erro amigável sem depender do trigger.
    if excursao["vagas_disponiveis"] < qtd_vagas:
        raise VagasInsuficientesError(
            f"Vagas insuficientes. Disponiveis: {excursao['vagas_disponiveis']}"
        )

    # Reserva sempre nasce 'pendente' até a confirmação de pagamento (seção 3.4).
    reserva = (
        supabase.get_supabase()
        .table("reserva")
        .insert(
            {
                "id_cliente": id_cliente,
                "id_excursao": id_excursao,
                "qtd_vagas": qtd_vagas,
                "status": "pendente",
                # Timestamp em UTC (fuso invariável) para ordenação consistente.
                "data_criacao": datetime.now(timezone.utc).isoformat(),
            }
        )
        .execute()
        .data[0]
    )

    # Registra um passageiro por vaga, vinculado à reserva recém-criada.
    if passageiros:
        supabase.get_supabase().table("passageiro").insert(
            [{"id_reserva": reserva["id"], **passageiro} for passageiro in passageiros]
        ).execute()

    # Decrementa as vagas disponíveis para manter o estoque consistente.
    supabase.get_supabase().table("excursao").update(
        {"vagas_disponiveis": excursao["vagas_disponiveis"] - qtd_vagas}
    ).eq("id", id_excursao).execute()

    return reserva


def listar_minhas(id_cliente: int) -> list[dict[str, Any]]:
    """Lista as reservas do cliente, enriquecidas com dados da excursão."""
    reservas = (
        supabase.get_supabase()
        .table("reserva")
        .select("*")
        .eq("id_cliente", id_cliente)
        .order("data_criacao", desc=True)
        .execute()
        .data
    )

    # Enriquece cada reserva com destino e nome da excursão para a listagem.
    for reserva in reservas:
        excursao = obter_excursao(reserva["id_excursao"])
        reserva["excursao_destino"] = excursao["destino"]
        reserva["excursao_nome"] = excursao["nome"]

    return reservas


def _cancelar_comum(
    reserva: dict[str, Any], id_excursao: int, devolver_vagas: bool
) -> dict[str, Any]:
    """Marcar a reserva como cancelada e devolver as vagas à excursão.

    Comum ao cancelamento pelo cliente (com prazo) e pelo admin (manual).
    """
    supabase.get_supabase().table("reserva").update({"status": "cancelada"}).eq(
        "id", reserva["id"]
    ).execute()

    if devolver_vagas:
        # O estoque de vagas volta a aumentar quando a reserva é cancelada.
        excursao = obter_excursao(id_excursao)
        supabase.get_supabase().table("excursao").update(
            {"vagas_disponiveis": excursao["vagas_disponiveis"] + reserva["qtd_vagas"]}
        ).eq("id", id_excursao).execute()

    return reserva


def _prazo_de_cancelamento_ok(excursao: dict[str, Any], hoje: date) -> bool:
    """Verifica se ainda é possível cancelar dentro do prazo (RF06).

    O cancelamento é permitido enquanto a diferença entre a data de saída e
    hoje for maior ou igual ao prazo_cancelamento_dias da excursão.
    """
    data_saida = date.fromisoformat(excursao["data_saida"])
    prazo = excursao.get("prazo_cancelamento_dias") or 0
    return (data_saida - hoje).days >= prazo


def cancelar_reserva(id_cliente: int, id_reserva: int, hoje: date | None = None) -> dict[str, Any]:
    """Cancela uma reserva do cliente respeitando o prazo da excursão.

    Raises:
        RecursoNaoEncontradoError: reserva inexistente.
        PrazoCancelamentoExpiradoError: fora do prazo (o botão some no front,
            mas o back-end valida de novo — seção 3.5).
    """
    # `hoje` é injetável para permitir testes determinísticos de prazo.
    # Usa a data local (fuso do servidor), que é a referência de negócio para
    # o prazo de cancelamento da excursão.
    hoje = hoje or datetime.now(timezone.utc).date()

    reserva = (
        supabase.get_supabase()
        .table("reserva")
        .select("*")
        .eq("id", id_reserva)
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

    return _cancelar_comum(reserva, reserva["id_excursao"], devolver_vagas=True)

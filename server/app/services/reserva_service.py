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
from app.core.datas import hoje_brasilia, idade_na_data
from app.core.exceptions import (
    ConsentimentoMenorError,
    ExcursaoIndisponivelError,
    PassageirosDivergentesError,
    PrazoCancelamentoExpiradoError,
    RecursoNaoEncontradoError,
    ReservaJaCanceladaError,
    VagasInsuficientesError,
)
from app.core.lgpd import VERSAO_CONSENTIMENTOS
from app.services.excursao_service import obter_excursao


def _validar_responsavel_menor(
    passageiros: list[dict[str, Any]],
    data_ida: date,
    declaracao: bool,
) -> bool:
    """Retorna se há menor e exige a declaração do responsável quando houver.

    A idade é calculada na data de ida da excursão (e não na data da reserva),
    porque é nessa data que a pessoa viaja. A checagem fica no serviço para
    valer tanto na criação quanto na edição dos passageiros.
    """
    tem_menor = any(
        idade_na_data(date.fromisoformat(str(p["data_nascimento"])[:10]), data_ida) < 18
        for p in passageiros
    )
    if tem_menor and not declaracao:
        raise ConsentimentoMenorError()
    return tem_menor


def criar_reserva(
    id_cliente: int,
    id_excursao: int,
    qtd_vagas: int,
    passageiros: list[dict[str, Any]],
    hoje: date | None = None,
    declaracao_responsavel_menor: bool = False,
) -> dict[str, Any]:
    """Cria uma reserva com status 'pendente'.

    Raises:
        ExcursaoIndisponivelError: se a excursão já tiver começado.
        VagasInsuficientesError: se a excursão não comportar a quantidade pedida.
    """
    # `hoje` é injetável para testes determinísticos de data.
    hoje = hoje or hoje_brasilia()
    excursao = obter_excursao(id_excursao)

    # Excursão que já começou não aceita novas reservas: o cliente não
    # conseguiria embarcar. A checagem usa a data de Brasília.
    if date.fromisoformat(excursao["data_ida"]) < hoje:
        raise ExcursaoIndisponivelError()

    # Passageiro menor exige a declaração do responsável legal. A idade é
    # calculada na data da excursão, não na data da reserva.
    tem_menor = _validar_responsavel_menor(
        passageiros,
        date.fromisoformat(excursao["data_ida"]),
        declaracao_responsavel_menor,
    )

    # Validação de overbooking na camada de aplicação (seção 6.6): mesmo com o
    # trigger no banco, validamos aqui para retornar erro amigável ao usuário.
    if excursao["vagas_disponiveis"] < qtd_vagas:
        raise VagasInsuficientesError(
            f"Vagas insuficientes. Disponiveis: {excursao['vagas_disponiveis']}"
        )

    # Reserva nasce 'pendente' até a confirmação de pagamento (seção 3.4).
    # data_reserva tem DEFAULT NOW() no banco; o trigger decrementa as vagas.
    agora = datetime.now(timezone.utc).isoformat()
    reserva = (
        supabase.get_supabase()
        .table("reserva")
        .insert(
            {
                "id_cliente": id_cliente,
                "id_excursao": id_excursao,
                "qtd_vagas": qtd_vagas,
                "status": "pendente",
                # Registro da declaração para fins de LGPD (art. 14).
                "declaracao_responsavel_menor": tem_menor,
                "declaracao_responsavel_menor_em": agora if tem_menor else None,
                "declaracao_responsavel_menor_versao": (
                    VERSAO_CONSENTIMENTOS if tem_menor else None
                ),
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

    # Enriquece cada reserva com dados da excursão (para prazo de
    # cancelamento no front) e a lista de passageiros (para edição).
    for reserva in reservas:
        excursao = obter_excursao(reserva["id_excursao"])
        reserva["excursao_destino"] = excursao["destino"]
        reserva["excursao_nome"] = excursao["nome_excursao"]
        reserva["data_ida"] = excursao["data_ida"]
        reserva["data_volta"] = excursao["data_volta"]
        # Necessário para montar a mensagem de pagamento (total) no WhatsApp.
        reserva["valor_pessoa"] = excursao["valor_pessoa"]
        reserva["prazo_cancelamento_dias"] = excursao.get("prazo_cancelamento_dias", 0)
        reserva["passageiros"] = (
            supabase.get_supabase()
            .table("passageiro")
            .select("id_passageiro, nome_passageiro, cpf, data_nascimento")
            .eq("id_reserva", reserva["id_reserva"])
            .execute()
            .data
        )

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
    # Usa a data de Brasília (fuso do negócio), não a data UTC do servidor.
    hoje = hoje or hoje_brasilia()

    reserva = supabase.buscar_um(
        supabase.get_supabase().table("reserva").select("*").eq("id_reserva", id_reserva)
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


def atualizar_passageiros(
    id_cliente: int,
    id_reserva: int,
    passageiros: list[dict[str, Any]],
    declaracao_responsavel_menor: bool = False,
) -> dict[str, Any]:
    """Substitui os passageiros de uma reserva (botão "continuar editando").

    A quantidade de vagas não muda, então o estoque não é tocado — apenas os
    dados dos passageiros são trocados. A lista deve ter exatamente qtd_vagas
    itens, um por vaga contratada.

    Raises:
        RecursoNaoEncontradoError: reserva inexistente ou de outro cliente.
        ReservaJaCanceladaError: reserva já cancelada não pode ser editada.
        PassageirosDivergentesError: lista com tamanho diferente de qtd_vagas.
    """
    reserva = supabase.buscar_um(
        supabase.get_supabase().table("reserva").select("*").eq("id_reserva", id_reserva)
    )
    # Reserva de outro cliente é tratada como inexistente (seção 6.2).
    if reserva is None or reserva["id_cliente"] != id_cliente:
        raise RecursoNaoEncontradoError("Reserva nao encontrada")

    if reserva["status"] == "cancelada":
        raise ReservaJaCanceladaError()

    if len(passageiros) != reserva["qtd_vagas"]:
        raise PassageirosDivergentesError()

    # A edição pode adicionar ou trocar um passageiro por um menor de 18
    # anos. A declaração é exigida de novo e o registro é atualizado junto
    # com a lista, para que o banco reflita a composição atual da reserva.
    excursao = obter_excursao(reserva["id_excursao"])
    tem_menor = _validar_responsavel_menor(
        passageiros,
        date.fromisoformat(excursao["data_ida"]),
        declaracao_responsavel_menor,
    )

    supabase.get_supabase().table("passageiro").delete().eq("id_reserva", id_reserva).execute()
    supabase.get_supabase().table("passageiro").insert(
        [{"id_reserva": id_reserva, **passageiro} for passageiro in passageiros]
    ).execute()

    agora = datetime.now(timezone.utc).isoformat()
    supabase.get_supabase().table("reserva").update(
        {
            "declaracao_responsavel_menor": tem_menor,
            "declaracao_responsavel_menor_em": agora if tem_menor else None,
            "declaracao_responsavel_menor_versao": (
                VERSAO_CONSENTIMENTOS if tem_menor else None
            ),
        }
    ).eq("id_reserva", id_reserva).execute()

    return reserva

# ===========================================================================
# IMF TURISMO — datas do negócio
# O calendário de Brasília é a referência para as regras de data (catálogo
# público, cancelamento). Sem horário de verão desde 2019, UTC-3 é fixo —
# por isso o offset fixo em vez de zoneinfo (sem dependência de tzdata no
# Windows/Vercel). Usar a data UTC trocaria o dia à noite (21h59 em Brasília
# já é o dia seguinte em UTC), escondendo ou liberando excursões um dia antes.
# ===========================================================================

from datetime import date, datetime, timedelta, timezone

FUSO_BRASILIA = timezone(timedelta(hours=-3))


def hoje_brasilia() -> date:
    """Data atual no calendário de Brasília (fuso do negócio)."""
    return datetime.now(FUSO_BRASILIA).date()

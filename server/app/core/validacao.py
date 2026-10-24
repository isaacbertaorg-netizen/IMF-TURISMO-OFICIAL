# ===========================================================================
# IMF TURISMO — validação de documentos brasileiros
# O CPF tem dois dígitos verificadores calculados por módulo 11. Conferir isso
# evita gravar CPF digitado errado (typo) ou número inventado, sem depender de
# serviço externo: o cálculo é local, instantâneo, gratuito e não envia dados
# do cliente para terceiros (LGPD).
#
# Importante: validar o dígito NÃO confirma que o CPF existe na Receita
# Federal. Para isso seria necessária uma API de consulta cadastral (com
# autenticação e custo), que é uma decisão separada.
# ===========================================================================

import re


def normalizar_cpf(valor: str | None) -> str:
    """Remove a máscara e mantém apenas os dígitos do CPF."""
    return re.sub(r"\D", "", str(valor or ""))


def cpf_valido(valor: str | None) -> bool:
    """Valida o CPF pelos dígitos verificadores (módulo 11).

    Aceita com ou sem máscara. Rejeita tamanho diferente de 11 e sequências
    repetidas (000.000.000-00, 111.111.111-11 etc.), que passam no cálculo
    mas não são CPFs reais.
    """
    digitos = normalizar_cpf(valor)
    if len(digitos) != 11 or digitos == digitos[0] * 11:
        return False

    # Primeiro dígito: pesos 10..2 sobre os 9 primeiros dígitos.
    # Segundo dígito: pesos 11..2 sobre os 10 primeiros.
    for tamanho in (9, 10):
        soma = sum(int(digitos[i]) * (tamanho + 1 - i) for i in range(tamanho))
        resto = soma % 11
        esperado = 0 if resto < 2 else 11 - resto
        if int(digitos[tamanho]) != esperado:
            return False

    return True

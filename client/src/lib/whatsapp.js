// ===========================================================================
// IMF TURISMO — pagamento combinado pelo WhatsApp
// O pagamento é feito diretamente com a empresa. Usamos o link wa.me
// (gratuito e oficial): abre o WhatsApp com a mensagem já preenchida.
// Não é necessária a API paga do WhatsApp Business (conta comercial,
// número verificado e templates aprovados) para este caso de uso.
// ===========================================================================

import { formatarDataBR, formatarMoeda } from './api.js'

// Fallback caso a rota pública /api/config não responda: o pagamento não pode
// ficar bloqueado por causa de uma chamada de configuração.
export const WHATSAPP_PADRAO = '556196389634'

export function linkWhatsApp(numero, mensagem) {
  // wa.me exige apenas dígitos, com DDI (55) + DDD + número.
  const digitos = String(numero || WHATSAPP_PADRAO).replace(/\D/g, '')
  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensagem)}`
}

// Mensagem já com os dados da reserva: a dona da empresa recebe tudo pronto
// e só precisa combinar a forma de pagamento.
export function mensagemPagamento(reserva) {
  const linhas = [
    'Olá! Acabei de fazer uma reserva na IMF Turismo e gostaria de combinar o pagamento.',
    '',
    `Reserva: #${reserva.id_reserva}`,
  ]

  if (reserva.destino) linhas.push(`Pacote: ${reserva.destino}`)
  if (reserva.data_ida) {
    linhas.push(
      `Período: ${formatarDataBR(reserva.data_ida)} a ${formatarDataBR(reserva.data_volta)}`,
    )
  }
  linhas.push(`Pessoas: ${reserva.qtd_vagas}`)
  if (reserva.valor_pessoa) {
    const total = Number(reserva.valor_pessoa) * Number(reserva.qtd_vagas)
    linhas.push(`Total: ${formatarMoeda(total)}`)
  }

  return linhas.join('\n')
}

// Fora do prazo o cancelamento automático fica bloqueado, mas o cliente
// ainda pode pedir a análise da empresa pelo WhatsApp — o reembolso ou
// crédito depende da política e é decidido manualmente.
export function mensagemCancelamento(reserva) {
  const linhas = [
    'Olá! Gostaria de solicitar o cancelamento de uma reserva na IMF Turismo.',
    '',
    `Reserva: #${reserva.id_reserva}`,
  ]

  if (reserva.destino) linhas.push(`Pacote: ${reserva.destino}`)
  if (reserva.data_ida) {
    linhas.push(
      `Período: ${formatarDataBR(reserva.data_ida)} a ${formatarDataBR(reserva.data_volta)}`,
    )
  }
  linhas.push(`Pessoas: ${reserva.qtd_vagas}`)
  linhas.push(
    '',
    'A reserva está fora do prazo de cancelamento automático. Gostaria de saber as opções de reembolso ou crédito.',
  )

  return linhas.join('\n')
}

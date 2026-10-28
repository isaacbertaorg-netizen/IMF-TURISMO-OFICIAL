// ===========================================================================
// IMF TURISMO — fundos rotativos das páginas de excursão
// A mesma lista é usada nos detalhes e na reserva. O índice vem do id da
// excursão, então cada pacote mantém o seu fundo de forma estável.
// ===========================================================================

import reserva1 from '../assets/reserva/reserva-1.jpg'
import reserva2 from '../assets/reserva/reserva-2.jpg'
import reserva3 from '../assets/reserva/reserva-3.jpg'
import reserva4 from '../assets/reserva/reserva-4.jpg'
import reserva5 from '../assets/reserva/reserva-5.jpg'
import reserva6 from '../assets/reserva/reserva-6.jpg'
import reserva7 from '../assets/reserva/reserva-7.jpg'

export const FUNDOS_EXCURSAO = [
  reserva1,
  reserva2,
  reserva3,
  reserva4,
  reserva5,
  reserva6,
  reserva7,
]

export function fundoDaExcursao(id) {
  const numero = Number(id)
  const indice = Number.isFinite(numero) ? Math.abs(Math.trunc(numero)) : 0
  return FUNDOS_EXCURSAO[indice % FUNDOS_EXCURSAO.length]
}

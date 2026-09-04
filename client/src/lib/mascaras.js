// ===========================================================================
// IMF TURISMO — máscaras de entrada (CPF e telefone brasileiro)
// Formatação progressiva enquanto digita; o envio ao back usa só dígitos.
// ===========================================================================

export function apenasDigitos(valor) {
  return String(valor ?? '').replace(/\D/g, '')
}

// 000.000.000-00 (parcial conforme a digitação).
export function formatarCPF(valor) {
  const d = apenasDigitos(valor).slice(0, 11)
  let texto = d.slice(0, 3)
  if (d.length > 3) texto += `.${d.slice(3, 6)}`
  if (d.length > 6) texto += `.${d.slice(6, 9)}`
  if (d.length > 9) texto += `-${d.slice(9)}`
  return texto
}

// 00000-000 (parcial conforme a digitação).
export function formatarCEP(valor) {
  const d = apenasDigitos(valor).slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

// +55 (DD) 90000-0000 ou +55 (DD) 0000-0000 (parcial; assume DDI 55).
export function formatarTelefone(valor) {
  const bruto = String(valor ?? '')
  let d = apenasDigitos(bruto)
  // O campo sempre renderiza o prefixo fixo "+55": ao reformatar, descarta
  // esses dois dígitos para não contaminar o DDD (ex.: "(55" fantasma que
  // reaparecia ao apagar). Sem o "+" (colado sem DDI), só descarta se o
  // total passar de 11 dígitos, preservando DDD 55 (ex.: Santa Maria/RS).
  if (bruto.trimStart().startsWith('+55')) {
    d = d.slice(2)
  } else if (d.startsWith('55') && d.length > 11) {
    d = d.slice(2)
  }
  d = d.slice(0, 11)
  if (d.length === 0) return ''
  if (d.length < 2) return `+55 (${d}`
  const resto = d.slice(2)
  let texto = `+55 (${d.slice(0, 2)})`
  if (resto.length === 0) return texto
  if (resto.length <= 4) return `${texto} ${resto}`
  // Celular (11 dígitos) separa 5+4; fixo (10) separa 4+4.
  const corte = d.length > 10 ? 5 : 4
  return `${texto} ${resto.slice(0, corte)}-${resto.slice(corte)}`
}

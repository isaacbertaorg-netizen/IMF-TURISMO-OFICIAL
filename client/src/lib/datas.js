// ===========================================================================
// IMF TURISMO — cálculos de data no front
// Evita `new Date()` para datas sem hora: o navegador pode deslocar o dia
// conforme o fuso. A comparação é feita pelos componentes da string ISO.
// ===========================================================================

// Retorna a idade completa em `referenciaISO` ou null se faltar data inválida.
export function idadeNaData(nascimentoISO, referenciaISO) {
  if (!nascimentoISO || !referenciaISO) return null

  const [anoN, mesN, diaN] = String(nascimentoISO).slice(0, 10).split('-').map(Number)
  const [anoR, mesR, diaR] = String(referenciaISO).slice(0, 10).split('-').map(Number)
  if ([anoN, mesN, diaN, anoR, mesR, diaR].some((n) => Number.isNaN(n))) return null

  let idade = anoR - anoN
  if (mesR < mesN || (mesR === mesN && diaR < diaN)) idade -= 1
  return idade
}

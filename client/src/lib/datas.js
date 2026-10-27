// ===========================================================================
// IMF TURISMO — cálculos de data no front
// Evita `new Date()` para datas sem hora: o navegador pode deslocar o dia
// conforme o fuso. A comparação é feita pelos componentes da string ISO.
// ===========================================================================

// Converte a data digitada para o formato ISO (AAAA-MM-DD), que é o formato
// aceito pela API. O campo nativo normalmente já entrega ISO, mas alguns
// navegadores/campos degradados podem devolver DD/MM/AAAA; nesse caso a
// conversão evita o erro de validação do back-end.
export function normalizarDataISO(valor) {
  const texto = String(valor ?? '').trim()
  if (!texto) return ''

  let ano
  let mes
  let dia
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) {
    ano = Number(iso[1])
    mes = Number(iso[2])
    dia = Number(iso[3])
  } else {
    const brasileira = texto.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/)
    if (!brasileira) return ''
    dia = Number(brasileira[1])
    mes = Number(brasileira[2])
    ano = Number(brasileira[3])
  }

  // Rejeita datas impossíveis (31/02, mês 13 etc.) e anos fora da faixa
  // aceitável para uma data de nascimento.
  if (ano < 1900 || ano > 9999) return ''
  const data = new Date(ano, mes - 1, dia)
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
    return ''
  }

  const mesISO = String(mes).padStart(2, '0')
  const diaISO = String(dia).padStart(2, '0')
  return `${ano}-${mesISO}-${diaISO}`
}

// Data de hoje no fuso local, no formato ISO usado nas comparações.
export function dataHojeISO() {
  const hoje = new Date()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')
  return `${hoje.getFullYear()}-${mes}-${dia}`
}

// Aplica a máscara DD/MM/AAAA enquanto o usuário digita. O campo de data é um
// texto livre (e não um input type="date"), justamente para garantir o formato
// brasileiro em qualquer sistema operacional ou idioma do navegador.
export function formatarDataDigitada(valor) {
  const digitos = String(valor ?? '').replace(/\D/g, '').slice(0, 8)
  if (digitos.length <= 2) return digitos
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`
}

// Converte uma data ISO (AAAA-MM-DD) para o formato brasileiro (DD/MM/AAAA).
// Usado para pré-preencher os campos de data na edição.
export function dataISOparaBR(valor) {
  const iso = normalizarDataISO(valor)
  if (!iso) return ''
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

// Confere se a data existe e não está no futuro.
export function dataNascimentoValida(valor) {
  const iso = normalizarDataISO(valor)
  if (!iso) return false
  return iso <= dataHojeISO()
}

// Retorna a idade completa em `referenciaISO` ou null se faltar data inválida.
export function idadeNaData(nascimentoISO, referenciaISO) {
  const nascimento = normalizarDataISO(nascimentoISO)
  const referencia = normalizarDataISO(referenciaISO)
  if (!nascimento || !referencia) return null

  const [anoN, mesN, diaN] = nascimento.split('-').map(Number)
  const [anoR, mesR, diaR] = referencia.split('-').map(Number)

  let idade = anoR - anoN
  if (mesR < mesN || (mesR === mesN && diaR < diaN)) idade -= 1
  return idade
}

// ===========================================================================
// IMF TURISMO — campo de data no padrão brasileiro (DD/MM/AAAA)
// Usa um input de texto com máscara em vez do type="date", porque o formato
// nativo acompanha o idioma/sistema do visitante (em inglês mostra MM/DD/YYYY).
// Aqui o formato é sempre dia/mês/ano, independente do dispositivo.
// ===========================================================================

import styled from 'styled-components'
import { colors } from '../theme.js'
import { formatarDataDigitada } from '../lib/datas.js'

const Input = styled.input`
  width: 100%;
  border: 0;
  border-radius: 999px;
  background-color: ${colors.inputBg};
  padding: 0.6rem 1rem;
  color: ${colors.navy};
  font: inherit;

  &::placeholder {
    color: ${colors.textMuted};
  }
`

export default function DateInput({ value, onChange, ...props }) {
  return (
    <Input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="DD/MM/AAAA"
      maxLength={10}
      value={value}
      onChange={(event) => onChange(formatarDataDigitada(event.target.value))}
      {...props}
    />
  )
}

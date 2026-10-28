// ===========================================================================
// IMF TURISMO — campo de data no padrão brasileiro (DD/MM/AAAA)
// Usa um input de texto com máscara em vez do type="date", porque o formato
// nativo acompanha o idioma/sistema do visitante (em inglês mostra MM/DD/YYYY).
// Aqui o formato é sempre dia/mês/ano, independente do dispositivo.
// O ícone de calendário abre o seletor nativo para quem prefere clicar.
// ===========================================================================

import { useRef } from 'react'
import styled from 'styled-components'
import { colors } from '../theme.js'
import { dataISOparaBR, formatarDataDigitada, normalizarDataISO } from '../lib/datas.js'

const Wrap = styled.div`
  position: relative;
  width: 100%;
`

const Input = styled.input`
  width: 100%;
  border: 0;
  border-radius: 999px;
  background-color: ${colors.inputBg};
  padding: 0.6rem 2.7rem 0.6rem 1rem;
  color: ${colors.navy};
  font: inherit;

  &::placeholder {
    color: ${colors.textMuted};
  }
`

const CalendarButton = styled.button`
  position: absolute;
  top: 50%;
  right: 0.55rem;
  transform: translateY(-50%);
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: ${colors.textMuted};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    color: ${colors.primary};
    background-color: rgb(30 136 229 / 0.08);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`

// Fica fora da tela visual, mas presente no layout para o showPicker().
const NativeDate = styled.input`
  position: absolute;
  right: 0.55rem;
  bottom: 0;
  width: 1px;
  height: 1px;
  opacity: 0;
  border: 0;
  padding: 0;
  pointer-events: none;
`

function IconeCalendario() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  )
}

export default function DateInput({ value, onChange, style, ...props }) {
  const nativoRef = useRef(null)

  function abrirCalendario() {
    const campo = nativoRef.current
    if (!campo) return
    try {
      if (typeof campo.showPicker === 'function') campo.showPicker()
      else campo.click()
    } catch {
      // Navegadores antigos podem bloquear showPicker; o texto continua editável.
      campo.focus()
    }
  }

  return (
    <Wrap style={style}>
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
      <CalendarButton type="button" onClick={abrirCalendario} aria-label="Abrir calendário">
        <IconeCalendario />
      </CalendarButton>
      <NativeDate
        ref={nativoRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={normalizarDataISO(value)}
        onChange={(event) => {
          if (event.target.value) onChange(dataISOparaBR(event.target.value))
        }}
      />
    </Wrap>
  )
}

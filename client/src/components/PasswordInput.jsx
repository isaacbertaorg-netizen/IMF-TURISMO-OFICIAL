// ===========================================================================
// IMF TURISMO — campo de senha com opção de mostrar/ocultar
// Mantém o mesmo visual de pílula dos formulários de autenticação e evita que
// o usuário erre a senha sem conseguir conferir o que digitou.
// ===========================================================================

import { useState } from 'react'
import styled from 'styled-components'
import { PillInput } from './AuthLayout.jsx'
import { colors } from '../theme.js'

const Wrap = styled.div`
  position: relative;
  width: 100%;
`

const Field = styled(PillInput)`
  padding-right: 5.2rem;
`

const Toggle = styled.button`
  position: absolute;
  top: 50%;
  right: 0.9rem;
  transform: translateY(-50%);
  border: 0;
  background: transparent;
  color: ${colors.navy};
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0.25rem;

  &:hover {
    text-decoration: underline;
  }
`

export default function PasswordInput(props) {
  const [mostrar, setMostrar] = useState(false)

  return (
    <Wrap>
      <Field {...props} type={mostrar ? 'text' : 'password'} />
      <Toggle
        type="button"
        aria-label={mostrar ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={mostrar}
        onClick={() => setMostrar((atual) => !atual)}
      >
        {mostrar ? 'Ocultar' : 'Mostrar'}
      </Toggle>
    </Wrap>
  )
}

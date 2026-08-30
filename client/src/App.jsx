// ===========================================================================
// IMF TURISMO — componente raiz do front-end
// Durante a preparação do ambiente este componente é apenas um placeholder
// que valida a integração do Design System (ThemeProvider + GlobalStyles).
// As rotas e telas reais entram nos próximos checkpoints.
// ===========================================================================

import styled from 'styled-components'
import { colors } from './theme.js'

const Container = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
  background-color: ${colors.backgroundAlt};
`

const Title = styled.h1`
  color: ${colors.navy};
  font-weight: 700;
  margin-bottom: 0.5rem;
`

const Badge = styled.span`
  background-color: ${colors.accent};
  color: ${colors.background};
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
`

const Status = styled.p`
  color: ${colors.textMuted};
  margin-top: 1rem;
`

function App() {
  return (
    <Container>
      <Badge>Ambiente pronto</Badge>
      <Title>IMF Turismo</Title>
      <Status>Front-end React conectado ao Design System. Aguardando próximo checkpoint.</Status>
    </Container>
  )
}

export default App

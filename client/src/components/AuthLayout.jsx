// ===========================================================================
// IMF TURISMO — moldura das telas de Login/Cadastro (Páginas 2 e 3)
// Fundo em foto de viagem em tela cheia + card branco centralizado, conforme
// a identidade visual mais forte do protótipo (seção 2 do PRODUCT.md).
// ===========================================================================

import styled from 'styled-components'
import { colors } from '../theme.js'
import logoUrl from '../assets/logo-imf-turismo.jfif'

const Wrap = styled.main`
  min-height: calc(100vh - 65px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background-image: url(${(props) => props.$fundo});
  background-size: cover;
  background-position: center;
`

const Card = styled.section`
  width: 100%;
  max-width: 460px;
  background-color: ${colors.background};
  border-radius: 0.5rem;
  box-shadow: 0 16px 48px rgb(15 45 82 / 0.25);
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`

const Logo = styled.img`
  height: 96px;
  width: auto;
  object-fit: contain;
`

export const PillInput = styled.input`
  width: 100%;
  border: 0;
  border-radius: 999px;
  background-color: ${colors.inputBg};
  padding: 0.8rem 1.25rem;
  color: ${colors.navy};

  &::placeholder {
    color: ${colors.textMuted};
  }
`

export const PrimaryButton = styled.button`
  width: 100%;
  max-width: 260px;
  border: 0;
  border-radius: 999px;
  background-color: ${colors.primary};
  color: #fff;
  font-weight: 700;
  font-size: 1.05rem;
  padding: 0.7rem 1rem;
`

export const ErrorText = styled.p`
  color: ${colors.danger};
  font-size: 0.85rem;
  text-align: center;
`

function AuthLayout({ fundo, children }) {
  return (
    <Wrap $fundo={fundo}>
      <Card>
        <Logo src={logoUrl} alt="IMF Turismo" />
        {children}
      </Card>
    </Wrap>
  )
}

export default AuthLayout

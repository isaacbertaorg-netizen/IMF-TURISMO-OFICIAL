// ===========================================================================
// IMF TURISMO — fundo com foto para páginas de excursão
// Mantém o cartão branco legível com uma camada clara sobre a imagem. O fundo
// é passado por prop para permitir a rotação por excursão.
// ===========================================================================

import styled from 'styled-components'

const Wrap = styled.div`
  min-height: calc(100vh - 65px);
  padding: 2rem 1rem 4rem;
  background-image:
    linear-gradient(rgb(255 255 255 / 0.86), rgb(255 255 255 / 0.86)),
    url(${(props) => props.$fundo});
  background-size: cover;
  background-position: center;
  background-attachment: fixed;

  @media (width <= 640px) {
    padding: 1.25rem 0.75rem 2.5rem;
    background-attachment: scroll;
  }
`

export default function PageBackground({ fundo, children }) {
  return <Wrap $fundo={fundo}>{children}</Wrap>
}

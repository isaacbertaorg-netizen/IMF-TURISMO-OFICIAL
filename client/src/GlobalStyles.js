// ===========================================================================
// IMF TURISMO — estilos globais e reset
// Usa os tokens do Design System (seção 2 do PRODUCT.md). Define a base de
// fontes e o reset mínimo para que todos os componentes partam de um padrão
// neutro e responsivo, sem depender dos estilos padrão do navegador.
// ===========================================================================

import { createGlobalStyle } from 'styled-components'
import { colors } from './theme.js'

export const GlobalStyles = createGlobalStyle`
  /* Reset básico: remove margens/paddings padrão e padroniza o box-sizing. */
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html,
  body {
    height: 100%;
  }

  body {
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: ${colors.navy};
    background-color: ${colors.background};
    /* mobile-first (RNF01): a fonte base parte de um valor acessível e escala.
       Ajustes por tela devem usar rem para respeitar o tamanho do usuário. */
    font-size: 16px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  button {
    font: inherit;
    cursor: pointer;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  /* Inputs em pílula são a assinatura visual dos formulários (seção 2.1). */
  input,
  select,
  textarea {
    font: inherit;
  }

  img {
    max-width: 100%;
    display: block;
  }
`

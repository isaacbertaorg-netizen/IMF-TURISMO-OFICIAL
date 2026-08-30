// ===========================================================================
// IMF TURISMO — entrada do front-end React
// Monta a árvore de componentes e injeta o tema (Design System, seção 2) e os
// estilos globais. O Router e o Provider do Supabase são adicionados quando
// as telas/rotas forem implementadas nos próximos checkpoints.
//
// Nota: os estilos base ficam em GlobalStyles (styled-components); não
// importamos o index.css do template, que traz tema roxo e layout fixo
// incompatíveis com o Design System.
// ===========================================================================

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'styled-components'
import App from './App.jsx'
import { GlobalStyles } from './GlobalStyles.js'
import { colors } from './theme.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* ThemeProvider expõe os tokens de cor a todos os componentes via props.theme. */}
    <ThemeProvider theme={colors}>
      <GlobalStyles />
      <App />
    </ThemeProvider>
  </StrictMode>,
)

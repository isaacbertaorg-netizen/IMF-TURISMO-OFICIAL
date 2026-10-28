// ===========================================================================
// IMF TURISMO — botão de favorito
// Usado nos cards da listagem e nos detalhes da excursão. Para visitantes
// deslogados, leva ao login guardando a página de origem.
// ===========================================================================

import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useAuth } from '../lib/auth.jsx'
import { useFavoritos } from '../lib/favoritos.jsx'
import { colors } from '../theme.js'

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid ${(props) => (props.$favorito ? '#FCA5A5' : '#E5E7EB')};
  border-radius: 999px;
  background-color: ${(props) => (props.$favorito ? '#FEF2F2' : '#F3F4F6')};
  color: ${(props) => (props.$favorito ? '#B91C1C' : colors.textMuted)};
  padding: ${(props) => (props.$destaque ? '0.6rem 1rem' : '0.35rem 0.75rem')};
  font-size: ${(props) => (props.$destaque ? '0.85rem' : '0.72rem')};
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    border-color: ${(props) => (props.$favorito ? '#F87171' : colors.primary)};
    color: ${(props) => (props.$favorito ? '#991B1B' : colors.primary)};
  }

  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }
`

export default function FavoriteButton({ idExcursao, destaque = false }) {
  const { autenticado, ehAdmin } = useAuth()
  const { ehFavorito, alternarFavorito, alternando } = useFavoritos()
  const navigate = useNavigate()
  const location = useLocation()

  if (ehAdmin) return null

  const favorito = ehFavorito(idExcursao)
  const salvando = Number(alternando) === Number(idExcursao)

  async function aoClicar() {
    if (!autenticado) {
      navigate('/login', {
        state: { from: `${location.pathname}${location.search}` },
      })
      return
    }

    const resultado = await alternarFavorito(idExcursao)
    if (resultado?.erro) window.alert(resultado.erro)
  }

  return (
    <Button
      type="button"
      $favorito={favorito}
      $destaque={destaque}
      disabled={salvando}
      aria-pressed={favorito}
      onClick={aoClicar}
    >
      <span aria-hidden="true">{favorito ? '♥' : '♡'}</span>
      {favorito ? 'Nos favoritos' : 'Adicionar aos favoritos'}
    </Button>
  )
}

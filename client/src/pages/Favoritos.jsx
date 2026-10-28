// ===========================================================================
// IMF TURISMO — Meus Favoritos
// Lista as excursões salvas pelo cliente. O botão de coração do card remove
// o item imediatamente, pois o estado é compartilhado pelo FavoritosProvider.
// ===========================================================================

import { Link } from 'react-router-dom'
import styled from 'styled-components'
import ExcursionCard from '../components/ExcursionCard.jsx'
import { useFavoritos } from '../lib/favoritos.jsx'
import { colors } from '../theme.js'

const Page = styled.main`
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
`

const Title = styled.h1`
  color: ${colors.navy};
  font-weight: 800;
  font-size: 2rem;
  margin-bottom: 0.35rem;
`

const Intro = styled.p`
  color: ${colors.textMuted};
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
`

const List = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`

const Feedback = styled.p`
  color: ${colors.textMuted};
  text-align: center;
  padding: 2.5rem 1rem;
  line-height: 1.6;
`

function Favoritos() {
  const { favoritos, carregando } = useFavoritos()

  return (
    <Page>
      <Title>Meus favoritos</Title>
      <Intro>
        As excursões que você salvou ficam aqui. Toque no coração novamente para remover.
      </Intro>

      {carregando && <Feedback>Carregando favoritos…</Feedback>}
      {!carregando && favoritos.length === 0 && (
        <Feedback>
          Você ainda não salvou nenhuma excursão.
          <br />
          <Link to="/excursoes">Ver excursões disponíveis →</Link>
        </Feedback>
      )}
      {!carregando && favoritos.length > 0 && (
        <List>
          {favoritos.map((excursao) => (
            <ExcursionCard key={excursao.id_excursao} excursao={excursao} />
          ))}
        </List>
      )}
    </Page>
  )
}

export default Favoritos

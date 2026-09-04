// ===========================================================================
// IMF TURISMO — card de excursão (Página 1 do protótipo)
// Layout desktop: foto à esquerda, texto à direita. No mobile empilha com a
// foto em cima (RNF01, seção 2.1). Usa apenas tokens do Design System.
// ===========================================================================

import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { colors } from '../theme.js'
import { formatarDataBR, formatarMoeda } from '../lib/api.js'
import cardCaldas from '../assets/card-caldas-novas.jpg'
import cardMaceio from '../assets/card-maceio.webp'

const Card = styled.article`
  display: flex;
  gap: 1.25rem;
  background-color: ${colors.background};
  border-radius: 1.25rem;
  box-shadow: 0 8px 24px rgb(15 45 82 / 0.08);
  padding: 1rem;
  overflow: hidden;

  @media (width <= 640px) {
    flex-direction: column;
  }
`

const Photo = styled.img`
  width: 220px;
  height: 140px;
  object-fit: cover;
  border-radius: 1rem;
  flex-shrink: 0;

  @media (width <= 640px) {
    width: 100%;
    height: 180px;
  }
`

const Body = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
`

const Title = styled.h2`
  color: ${colors.navy};
  font-size: 1.25rem;
  font-weight: 800;
`

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  color: ${colors.textMuted};
  font-size: 0.9rem;
`

const Meta = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
`

const CalendarIcon = styled.span`
  color: ${colors.success};
`

const PriceIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
  background-color: ${colors.primary};
  color: #fff;
  font-size: 0.7rem;
  font-weight: 800;
`

const Star = styled.span`
  color: ${colors.star};
`

const Footer = styled.div`
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 0.5rem;
`

const FavTag = styled.span`
  font-size: 0.7rem;
  color: ${colors.textMuted};
  background-color: #e5e7eb;
  border-radius: 0.25rem;
  padding: 0.1rem 0.4rem;
`

const DetailsButton = styled(Link)`
  background-color: ${colors.primary};
  color: #fff;
  font-weight: 700;
  font-size: 0.8rem;
  border-radius: 999px;
  padding: 0.4rem 1rem;
`

// Foto local por destino, usada quando não há imagem no banco ou a URL falha.
function fotoLocal(destino) {
  const texto = String(destino ?? '').toLowerCase()
  if (texto.includes('caldas')) return cardCaldas
  if (texto.includes('macei')) return cardMaceio
  return cardCaldas
}

// Foto do banco (coluna imagem_url) com fallback local por destino, para
// excursões antigas ainda sem imagem cadastrada.
function escolherFoto(excursao) {
  if (excursao?.imagem_url) return excursao.imagem_url
  return fotoLocal(excursao?.destino)
}

function ExcursionCard({ excursao }) {
  const periodo = `${formatarDataBR(excursao.data_ida)} a ${formatarDataBR(excursao.data_volta)}`
  // Se a URL do banco quebrar (Storage sem o arquivo), troca pela local uma vez.
  function fotoQuebrou(event) {
    if (event.currentTarget.dataset.fb !== '1') {
      event.currentTarget.dataset.fb = '1'
      event.currentTarget.src = fotoLocal(excursao.destino)
    }
  }
  return (
    <Card>
      <Photo src={escolherFoto(excursao)} alt={excursao.destino} loading="lazy" onError={fotoQuebrou} />
      <Body>
        <Title>{excursao.destino}</Title>
        <MetaRow>
          <Meta>
            <CalendarIcon aria-hidden="true">📅</CalendarIcon>
            {periodo}
          </Meta>
        </MetaRow>
        <MetaRow>
          <Meta>
            <PriceIcon aria-hidden="true">$</PriceIcon>
            {formatarMoeda(excursao.valor_pessoa)}
          </Meta>
          {/* A avaliação só aparece quando o back-end a fornecer; o schema
              atual não possui coluna de nota, então não inventamos valor. */}
          {excursao.avaliacao !== undefined && excursao.avaliacao !== null && (
            <Meta>
              <Star aria-hidden="true">★</Star>
              {excursao.avaliacao}
            </Meta>
          )}
          <Meta>
            {excursao.vagas_disponiveis} vagas disponíveis
          </Meta>
        </MetaRow>
        <Footer>
          <FavTag>Adicionar aos favoritos</FavTag>
          <DetailsButton to={`/excursoes/${excursao.id_excursao}`}>Ver detalhes</DetailsButton>
        </Footer>
      </Body>
    </Card>
  )
}

export default ExcursionCard

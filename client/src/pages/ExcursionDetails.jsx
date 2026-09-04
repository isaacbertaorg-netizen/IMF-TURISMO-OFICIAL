// ===========================================================================
// IMF TURISMO — Detalhes da Excursão (seção 3.2 do PRODUCT.md)
// Foto grande, título navy, atributos completos e botão Reservar. Exige login:
// se deslogado, o fluxo de reserva redireciona para /login (entra no próximo
// checkpoint); por enquanto o botão aponta para a rota de reserva futura.
// ===========================================================================

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { colors } from '../theme.js'
import { api, formatarDataBR, formatarMoeda } from '../lib/api.js'
import cardCaldas from '../assets/card-caldas-novas.jpg'
import cardMaceio from '../assets/card-maceio.webp'

const Page = styled.main`
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
`

const Back = styled(Link)`
  display: inline-block;
  color: ${colors.textMuted};
  font-size: 0.9rem;
  margin-bottom: 1rem;
`

const Card = styled.article`
  background-color: ${colors.background};
  border-radius: 1.25rem;
  box-shadow: 0 8px 24px rgb(15 45 82 / 0.08);
  overflow: hidden;
`

const Photo = styled.img`
  width: 100%;
  height: 320px;
  object-fit: cover;

  @media (width <= 640px) {
    height: 200px;
  }
`

const Body = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const Title = styled.h1`
  color: ${colors.navy};
  font-weight: 800;
  font-size: 1.75rem;
`

const Meta = styled.p`
  color: ${colors.textMuted};
`

const Price = styled.p`
  color: ${colors.navy};
  font-weight: 800;
  font-size: 1.25rem;
`

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const SectionTitle = styled.h2`
  color: ${colors.navy};
  font-size: 1rem;
  font-weight: 700;
`

const Text = styled.p`
  color: ${colors.navy};
`

const Actions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
`

const ReserveButton = styled(Link)`
  background-color: ${colors.primary};
  color: #fff;
  font-weight: 700;
  border-radius: 999px;
  padding: 0.7rem 1.8rem;
`

const Feedback = styled.p`
  text-align: center;
  color: ${colors.textMuted};
  padding: 2rem 0;
`

function escolherFoto(excursao) {
  if (excursao?.imagem_url) return excursao.imagem_url
  return fotoLocal(excursao?.destino)
}

// Foto local por destino, usada quando não há imagem no banco ou a URL falha.
function fotoLocal(destino) {
  const texto = String(destino ?? '').toLowerCase()
  if (texto.includes('caldas')) return cardCaldas
  if (texto.includes('macei')) return cardMaceio
  return cardCaldas
}

function ExcursionDetails() {
  const { id } = useParams()
  const [excursao, setExcursao] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [naoEncontrada, setNaoEncontrada] = useState(false)

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      setNaoEncontrada(false)
      try {
        const resp = await api.get(`/api/excursoes/${id}`)
        setExcursao(resp.data)
      } catch (err) {
        // 404 significa id inexistente; demais erros, falha de rede/API.
        setNaoEncontrada(err?.response?.status === 404)
        setExcursao(null)
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [id])

  if (carregando) {
    return (
      <Page>
        <Feedback>Carregando detalhes…</Feedback>
      </Page>
    )
  }

  if (!excursao) {
    return (
      <Page>
        <Back to="/">← Voltar à página inicial</Back>
        <Feedback>{naoEncontrada ? 'Excursão não encontrada.' : 'Falha ao carregar. Tente novamente.'}</Feedback>
      </Page>
    )
  }

  return (
    <Page>
      <Back to="/">← Voltar à página inicial</Back>
      <Card>
        <Photo
          src={escolherFoto(excursao)}
          alt={excursao.destino}
          onError={(e) => {
            if (e.currentTarget.dataset.fb !== '1') {
              e.currentTarget.dataset.fb = '1'
              e.currentTarget.src = fotoLocal(excursao.destino)
            }
          }}
        />
        <Body>
          <Title>{excursao.destino}</Title>
          <Meta>
            {formatarDataBR(excursao.data_ida)} a {formatarDataBR(excursao.data_volta)} ·{' '}
            {excursao.vagas_disponiveis} de {excursao.vagas_totais} vagas disponíveis
          </Meta>
          <Price>{formatarMoeda(excursao.valor_pessoa)} / pessoa</Price>
          <Section>
            <SectionTitle>Roteiro</SectionTitle>
            <Text>{excursao.descricao_roteiro}</Text>
          </Section>
          {excursao.itens_inclusos && (
            <Section>
              <SectionTitle>Itens inclusos</SectionTitle>
              <Text>{excursao.itens_inclusos}</Text>
            </Section>
          )}
          <Actions>
            {/* O fluxo completo de reserva (seção 3.4) entra no próximo checkpoint. */}
            <ReserveButton to={`/excursoes/${excursao.id_excursao}/reservar`}>Reservar</ReserveButton>
          </Actions>
        </Body>
      </Card>
    </Page>
  )
}

export default ExcursionDetails

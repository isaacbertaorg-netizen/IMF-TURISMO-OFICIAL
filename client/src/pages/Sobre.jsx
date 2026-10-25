// ===========================================================================
// IMF TURISMO — Sobre nós
// Página institucional com o posicionamento da empresa: atendimento
// individualizado e acompanhamento antes, durante e depois da viagem.
// ===========================================================================

import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { CADASTUR, EMAIL_CONTATO, FACEBOOK_URL, HORARIO_ATENDIMENTO, INSTAGRAM_URL, TAGLINE } from '../lib/contato.js'
import { useWhatsApp } from '../lib/useWhatsApp.js'
import { linkWhatsApp } from '../lib/whatsapp.js'
import { colors } from '../theme.js'
import fotoIara from '../assets/home/iara.jpg'

const Page = styled.main`
  max-width: 820px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
`

const Title = styled.h1`
  color: ${colors.navy};
  font-weight: 800;
  font-size: 2rem;
  margin-bottom: 0.35rem;
`

const Subtitle = styled.p`
  color: ${colors.primary};
  font-weight: 700;
  font-size: 1.05rem;
  margin-bottom: 1.25rem;
`

const Card = styled.article`
  background-color: ${colors.background};
  border-radius: 1rem;
  box-shadow: 0 8px 24px rgb(15 45 82 / 0.08);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`

const Paragraph = styled.p`
  color: #374151;
  font-size: 0.95rem;
  line-height: 1.65;
`

const Strong = styled.strong`
  color: ${colors.navy};
`

const Commitments = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding-left: 1.1rem;
  color: #374151;
  font-size: 0.95rem;
  line-height: 1.5;
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.5rem;
`

const PrimaryAction = styled(Link)`
  border-radius: 999px;
  background-color: ${colors.primary};
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0.65rem 1.25rem;
`

const WhatsAppAction = styled.a`
  border-radius: 999px;
  background-color: ${colors.successDark};
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0.65rem 1.25rem;

  &:hover {
    filter: brightness(0.95);
  }
`

const Contact = styled.div`
  margin-top: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  color: ${colors.textMuted};
  font-size: 0.85rem;
`

const ContactLink = styled.a`
  color: ${colors.navy};
  font-weight: 600;
`

const OwnerCard = styled.section`
  margin-top: 1.25rem;
  background-color: ${colors.background};
  border-radius: 1rem;
  box-shadow: 0 8px 24px rgb(15 45 82 / 0.08);
  padding: 1.5rem;
  display: grid;
  grid-template-columns: minmax(0, 0.7fr) minmax(0, 1.3fr);
  gap: 1.5rem;
  align-items: center;

  @media (width <= 720px) {
    grid-template-columns: 1fr;
  }
`

const OwnerPhoto = styled.img`
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  object-position: center 22%;
  border-radius: 1rem;
`

const OwnerContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const OwnerTitle = styled.h2`
  color: ${colors.navy};
  font-size: 1.45rem;
  font-weight: 800;
  line-height: 1.25;
`

function Sobre() {
  const numero = useWhatsApp()
  const mensagem = 'Olá! Vim pelo site da IMF Turismo e gostaria de saber mais sobre os pacotes.'
  const instagram = INSTAGRAM_URL.replace(/\/$/, '').split('/').pop()
  const facebook = FACEBOOK_URL.replace(/\/$/, '').split('/').pop()

  return (
    <Page>
      <Title>Sobre a IMF Turismo</Title>
      <Subtitle>{TAGLINE}</Subtitle>

      <Card>
        <Paragraph>
          A IMF Turismo acredita que cada viagem é única — e o atendimento também. Por isso,
          cada cliente é atendido de forma individual, com atenção ao seu tempo, às suas
          necessidades e ao seu jeito de viajar.
        </Paragraph>

        <Paragraph>
          <Strong>Seu atendimento não termina quando vendemos seu pacote!</Strong> A IMF
          Turismo dá toda a assistência, principalmente quando você é impedido de viajar na
          data prevista. Temos um pós-venda diferenciado.
        </Paragraph>

        <Paragraph>
          Do primeiro contato ao retorno, a equipe acompanha cada etapa: escolha do destino,
          reserva, pagamento e suporte durante a viagem.
        </Paragraph>

        <Commitments>
          <li>Atendimento individualizado, do início ao fim.</li>
          <li>Suporte antes, durante e depois da viagem.</li>
          <li>Pós-venda diferenciado para imprevistos.</li>
          <li>Transparência nas condições e no pagamento.</li>
        </Commitments>

        <Actions>
          <PrimaryAction to="/excursoes">Ver pacotes</PrimaryAction>
          <WhatsAppAction
            href={linkWhatsApp(numero, mensagem)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Falar no WhatsApp
          </WhatsAppAction>
        </Actions>

        <Contact>
          <span>{HORARIO_ATENDIMENTO}</span>
          <ContactLink href={`mailto:${EMAIL_CONTATO}`}>{EMAIL_CONTATO}</ContactLink>
          {instagram && (
            <ContactLink href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              Instagram: @{instagram}
            </ContactLink>
          )}
          {facebook && (
            <ContactLink href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
              Facebook: /{facebook}
            </ContactLink>
          )}
          {CADASTUR && <span>Cadastur {CADASTUR}</span>}
        </Contact>
      </Card>

      <OwnerCard>
        <OwnerPhoto src={fotoIara} alt="Iara Maria Ferreira, fundadora da IMF Turismo" loading="lazy" />
        <OwnerContent>
          <OwnerTitle>IMF são as iniciais de Iara Maria Ferreira.</OwnerTitle>
          <Paragraph>
            A empresa nasceu em 2011, quando Iara buscou um pacote de viagem e acabou assumindo a
            organização. Desde então, ela se especializou, construiu uma rede de contatos e hoje
            conduz excursões para Caldas Novas e o Nordeste.
          </Paragraph>
          <Paragraph>
            Como guia de turismo com Cadastur, Iara acompanha cada grupo de perto — do primeiro
            contato ao retorno. É esse cuidado que faz o atendimento da IMF ser individual de
            verdade.
          </Paragraph>
          <Paragraph>
            <Strong>Iara Maria Ferreira</Strong> — Fundadora e Guia de Turismo
            <br />
            Cadastur {CADASTUR}
          </Paragraph>
        </OwnerContent>
      </OwnerCard>
    </Page>
  )
}

export default Sobre

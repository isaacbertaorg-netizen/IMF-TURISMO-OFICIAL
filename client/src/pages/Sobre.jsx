// ===========================================================================
// IMF TURISMO — Sobre nós
// Página institucional com o posicionamento da empresa: atendimento
// individualizado e acompanhamento antes, durante e depois da viagem.
// ===========================================================================

import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { EMAIL_CONTATO, FACEBOOK_URL, HORARIO_ATENDIMENTO, INSTAGRAM_URL, TAGLINE } from '../lib/contato.js'
import { useWhatsApp } from '../lib/useWhatsApp.js'
import { linkWhatsApp } from '../lib/whatsapp.js'
import { colors } from '../theme.js'

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
          <PrimaryAction to="/">Ver pacotes</PrimaryAction>
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
        </Contact>
      </Card>
    </Page>
  )
}

export default Sobre

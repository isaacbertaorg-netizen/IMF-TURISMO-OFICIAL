// ===========================================================================
// IMF TURISMO — Perguntas frequentes
// Reúne as dúvidas mais comuns dos clientes: reserva, pagamento, hotéis,
// quartos, cancelamento, menores, documentos e suporte durante a viagem.
// ===========================================================================

import styled from 'styled-components'
import { EMAIL_CONTATO, FACEBOOK_URL, HORARIO_ATENDIMENTO, INSTAGRAM_URL } from '../lib/contato.js'
import { useWhatsApp } from '../lib/useWhatsApp.js'
import { formatarWhatsApp, linkWhatsApp } from '../lib/whatsapp.js'
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

const Intro = styled.p`
  color: ${colors.textMuted};
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1.25rem;
`

const Card = styled.article`
  background-color: ${colors.background};
  border-radius: 1rem;
  box-shadow: 0 8px 24px rgb(15 45 82 / 0.08);
  padding: 0.5rem 1.5rem;
`

const Item = styled.details`
  border-bottom: 1px solid #e5e7eb;
  padding: 0.9rem 0;

  &:last-child {
    border-bottom: 0;
  }
`

const Question = styled.summary`
  cursor: pointer;
  color: ${colors.navy};
  font-weight: 700;
  font-size: 0.95rem;
  line-height: 1.45;

  &:hover {
    color: ${colors.primary};
  }
`

const Answer = styled.p`
  color: #374151;
  font-size: 0.9rem;
  line-height: 1.65;
  margin-top: 0.6rem;
`

const ContactLink = styled.a`
  color: ${colors.navy};
  font-weight: 600;
`

const Help = styled.section`
  margin-top: 1.25rem;
  background-color: ${colors.backgroundAlt};
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`

const HelpTitle = styled.h2`
  color: ${colors.navy};
  font-size: 1.05rem;
  font-weight: 800;
`

const HelpText = styled.p`
  color: #374151;
  font-size: 0.9rem;
  line-height: 1.55;
`

function PerguntasFrequentes() {
  const numero = useWhatsApp()
  const instagram = INSTAGRAM_URL.replace(/\/$/, '').split('/').pop()
  const facebook = FACEBOOK_URL.replace(/\/$/, '').split('/').pop()
  const mensagem = 'Olá! Vim pelo site da IMF Turismo e tenho uma dúvida.'

  return (
    <Page>
      <Title>Perguntas frequentes</Title>
      <Intro>
        Reunimos as dúvidas mais comuns sobre reservas, pagamento, hospedagem e suporte. As
        respostas valem para as condições gerais; para o seu pacote específico, confirme com a
        equipe.
      </Intro>

      <Card>
        <Item>
          <Question>Como faço uma reserva?</Question>
          <Answer>
            Escolha uma excursão na página inicial, clique em “Reservar”, informe a quantidade de
            pessoas e confirme. É necessário ter uma conta no site. Depois da reserva, o pagamento
            é combinado diretamente com a IMF Turismo pelo WhatsApp.
          </Answer>
        </Item>

        <Item>
          <Question>Como funciona o pagamento?</Question>
          <Answer>
            O pagamento não é feito pelo site. Ao confirmar a reserva, você recebe o link do
            WhatsApp com os dados do pacote já preenchidos; a equipe combina as formas de pagamento
            e o parcelamento com você.
          </Answer>
        </Item>

        <Item>
          <Question>O parcelamento no cartão é sem juros?</Question>
          <Answer>
            O parcelamento no cartão é uma das formas de pagamento, mas as condições (quantidade de
            parcelas e juros) dependem do pacote e da data da viagem. Confirme com a equipe pelo
            WhatsApp antes de fechar a reserva.
          </Answer>
        </Item>

        <Item>
          <Question>Como são os hotéis e a disposição dos quartos?</Question>
          <Answer>
            A hospedagem varia conforme o pacote. As informações disponíveis sobre o hotel aparecem
            na página de cada excursão. Para saber o porte do hotel, a categoria, o tamanho dos
            quartos e a disposição (individual, duplo ou triplo), fale com a equipe pelo WhatsApp
            antes de reservar.
          </Answer>
        </Item>

        <Item>
          <Question>Posso cancelar minha reserva?</Question>
          <Answer>
            Sim. O cancelamento automático pode ser feito em “Minhas Reservas” até o prazo definido
            para cada pacote (em geral, 21 dias antes da data de ida). O próprio sistema indica se o
            prazo ainda está aberto. Depois desse prazo, envie o pedido pelo WhatsApp; a equipe
            analisa as opções de reembolso ou crédito.
          </Answer>
        </Item>

        <Item>
          <Question>Viajo com criança ou adolescente. O que preciso?</Question>
          <Answer>
            Passageiros menores de 18 anos precisam da declaração do responsável legal, marcada no
            momento da reserva. No embarque, o responsável deve levar os documentos dele e do menor.
            Em caso de dúvida, fale com a equipe.
          </Answer>
        </Item>

        <Item>
          <Question>Quais documentos preciso levar?</Question>
          <Answer>
            Para viagens nacionais, leve documento oficial com foto (RG ou CNH) para os adultos e
            documento com foto ou certidão de nascimento para os menores. Para destinos
            internacionais, é necessário passaporte válido. Confirme as exigências específicas do
            destino com a equipe.
          </Answer>
        </Item>

        <Item>
          <Question>A IMF Turismo dá suporte durante a viagem?</Question>
          <Answer>
            Sim. O atendimento não termina na venda: a IMF Turismo acompanha o cliente antes,
            durante e depois da viagem, inclusive em imprevistos e quando você é impedido de viajar
            na data prevista. O atendimento é {HORARIO_ATENDIMENTO.toLowerCase()}.
          </Answer>
        </Item>

        <Item>
          <Question>O que está incluso no pacote?</Question>
          <Answer>
            Cada excursão tem sua própria lista de itens inclusos, exibida na página do pacote.
            Leia com atenção antes de reservar e confirme qualquer dúvida com a equipe.
          </Answer>
        </Item>

        <Item>
          <Question>Como falo com a IMF Turismo?</Question>
          <Answer>
            WhatsApp: <ContactLink href={linkWhatsApp(numero, mensagem)}>{formatarWhatsApp(numero)}</ContactLink>.
            E-mail: <ContactLink href={`mailto:${EMAIL_CONTATO}`}>{EMAIL_CONTATO}</ContactLink>.
            {instagram && (
              <>
                {' '}Instagram:{' '}
                <ContactLink href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                  @{instagram}
                </ContactLink>
                .
              </>
            )}
            {facebook && (
              <>
                {' '}Facebook:{' '}
                <ContactLink href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
                  /{facebook}
                </ContactLink>
                .
              </>
            )}{' '}
            Atendimento {HORARIO_ATENDIMENTO.toLowerCase()}.
          </Answer>
        </Item>
      </Card>

      <Help>
        <HelpTitle>Ainda tem dúvidas?</HelpTitle>
        <HelpText>
          Fale com a equipe pelo WhatsApp{' '}
          <ContactLink href={linkWhatsApp(numero, mensagem)}>{formatarWhatsApp(numero)}</ContactLink>{' '}
          ou envie um e-mail para{' '}
          <ContactLink href={`mailto:${EMAIL_CONTATO}`}>{EMAIL_CONTATO}</ContactLink>. Respondemos
          das 8h às 20h.
        </HelpText>
      </Help>
    </Page>
  )
}

export default PerguntasFrequentes

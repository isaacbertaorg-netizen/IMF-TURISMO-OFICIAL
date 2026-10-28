// ===========================================================================
// IMF TURISMO — Política de Privacidade e Termos em modal compacto
// Os links de consentimento abrem este resumo sem sair da tela atual. Quem
// quiser o texto completo continua tendo acesso à página /politica-de-privacidade.
// ===========================================================================

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { EMAIL_CONTATO } from '../lib/contato.js'
import { colors } from '../theme.js'

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: rgb(15 45 82 / 0.55);
`

const Dialog = styled.div`
  width: 100%;
  max-width: 620px;
  max-height: min(85vh, 720px);
  display: flex;
  flex-direction: column;
  background-color: ${colors.background};
  border-radius: 1rem;
  box-shadow: 0 24px 64px rgb(15 45 82 / 0.35);
`

const Header = styled.div`
  padding: 1.25rem 1.4rem 0.75rem;
`

const Title = styled.h2`
  color: ${colors.navy};
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0 0 0.25rem;
`

const Version = styled.p`
  color: ${colors.textMuted};
  font-size: 0.78rem;
  margin: 0;
`

const Body = styled.div`
  overflow-y: auto;
  padding: 0 1.4rem 1rem;
`

const SectionTitle = styled.h3`
  color: ${colors.navy};
  font-size: 0.92rem;
  font-weight: 800;
  margin: 0.9rem 0 0.25rem;
`

const Paragraph = styled.p`
  color: ${colors.navy};
  font-size: 0.86rem;
  line-height: 1.55;
  margin: 0.35rem 0;
`

const Footer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1.4rem;
  border-top: 1px solid #e5e7eb;
`

const FullLink = styled(Link)`
  color: ${colors.primary};
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: underline;
`

const CloseButton = styled.button`
  border: 0;
  border-radius: 999px;
  background-color: ${colors.navy};
  color: #fff;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 0.6rem 1.4rem;
  cursor: pointer;
`

const Trigger = styled.button`
  border: 0;
  padding: 0;
  background: transparent;
  color: ${colors.primary};
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
`

function PolicyDialog({ onClose }) {
  const fecharRef = useRef(null)

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    fecharRef.current?.focus()

    function aoPressionar(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', aoPressionar)
    return () => {
      document.body.style.overflow = overflowAnterior
      document.removeEventListener('keydown', aoPressionar)
    }
  }, [onClose])

  return createPortal(
    <Overlay onClick={onClose}>
      <Dialog
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-politica"
        onClick={(event) => event.stopPropagation()}
      >
        <Header>
          <Title id="titulo-politica">Política de Privacidade e Termos de Uso</Title>
          <Version>Versão 1.0 — resumo. O texto completo está na página da política.</Version>
        </Header>

        <Body>
          <Paragraph>
            A IMF Turismo usa seus dados para criar sua conta, registrar reservas, emitir os
            pacotes e prestar atendimento. Também pode cumprir obrigações legais e prevenir fraudes.
          </Paragraph>

          <SectionTitle>Dados coletados</SectionTitle>
          <Paragraph>
            Cadastro (nome, CPF, e-mail, telefone e endereço), dados dos passageiros (nome, CPF e
            data de nascimento), reservas, foto de perfil opcional e registros de consentimento.
            Não armazenamos dados de cartão: o pagamento é combinado pelo WhatsApp.
          </Paragraph>

          <SectionTitle>Compartilhamento</SectionTitle>
          <Paragraph>
            Compartilhamos apenas o necessário com fornecedores da viagem (transporte, hospedagem e
            receptivo), prestadores de tecnologia e autoridades quando houver obrigação legal. Não
            vendemos dados pessoais.
          </Paragraph>

          <SectionTitle>Seus direitos</SectionTitle>
          <Paragraph>
            Você pode pedir acesso, correção, eliminação, portabilidade e informações sobre
            compartilhamentos, além de revogar consentimentos. Fale com a IMF pelo e-mail{' '}
            <strong>{EMAIL_CONTATO}</strong>.
          </Paragraph>

          <SectionTitle>Termos de uso</SectionTitle>
          <Paragraph>
            Informe dados verdadeiros e mantenha sua senha em sigilo. A reserva fica pendente até a
            IMF confirmar o pagamento. Cancelamentos seguem o prazo informado na excursão, e
            excursões já iniciadas não aceitam novas reservas.
          </Paragraph>
        </Body>

        <Footer>
          <FullLink to="/politica-de-privacidade" onClick={onClose}>
            Ler a política completa
          </FullLink>
          <CloseButton ref={fecharRef} type="button" onClick={onClose}>
            Fechar
          </CloseButton>
        </Footer>
      </Dialog>
    </Overlay>,
    document.body,
  )
}

export default function PolicyLink({ children, className, style, onClick }) {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      <Trigger
        type="button"
        className={className}
        style={style}
        onClick={(event) => {
          // Impede que o clique em um link dentro de <label> marque o checkbox.
          event.preventDefault()
          event.stopPropagation()
          onClick?.(event)
          setAberto(true)
        }}
      >
        {children}
      </Trigger>
      {aberto && <PolicyDialog onClose={() => setAberto(false)} />}
    </>
  )
}

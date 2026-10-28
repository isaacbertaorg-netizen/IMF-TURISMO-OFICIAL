// ===========================================================================
// IMF TURISMO — rodapé público
// Repete os caminhos principais, concentra os canais de atendimento e deixa
// à vista os dados institucionais (e-mail, WhatsApp, Cadastur e endereço).
// Some no painel administrativo para não misturar com a área interna.
// ===========================================================================

import { Link, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import {
  CADASTUR,
  CNPJ,
  EMAIL_CONTATO,
  ENDERECO,
  FACEBOOK_URL,
  HORARIO_ATENDIMENTO,
  INSTAGRAM_URL,
  TAGLINE,
} from '../lib/contato.js'
import { useWhatsApp } from '../lib/useWhatsApp.js'
import { formatarWhatsApp, linkWhatsApp } from '../lib/whatsapp.js'
import { colors } from '../theme.js'
import PolicyModalLink from './PolicyModal.jsx'
import logoUrl from '../assets/logo-imf-turismo.jfif'

const Wrap = styled.footer`
  margin-top: auto;
  background-color: ${colors.navy};
  color: #fff;
`

const Inner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 1rem 1.75rem;
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1.2fr;
  gap: 2rem;

  @media (width <= 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (width <= 560px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`

const Brand = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`

const BrandRow = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  color: #fff;
`

// O logo tem fundo claro; a caixa branca mantém a leitura sobre o azul-marinho.
const LogoBox = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border-radius: 0.5rem;
  padding: 0.35rem 0.5rem;
`

const Logo = styled.img`
  height: 44px;
  width: auto;
  object-fit: contain;
`

const BrandName = styled.span`
  font-size: 1.25rem;
  white-space: nowrap;
`

const BrandIMF = styled.span`
  font-weight: 800;
`

const BrandTurismo = styled.span`
  font-weight: 400;
`

const Tagline = styled.p`
  margin-top: 0.85rem;
  max-width: 270px;
  color: #cbd5e1;
  font-size: 0.88rem;
  line-height: 1.55;
`

const Socials = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`

const SocialLink = styled.a`
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid rgb(255 255 255 / 0.25);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;

  &:hover {
    background-color: ${colors.primary};
    border-color: ${colors.primary};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
`

const ColumnTitle = styled.h2`
  color: #fff;
  font-size: 0.95rem;
  font-weight: 800;
  margin-bottom: 0.15rem;
`

const FooterLink = styled(Link)`
  color: #dbe4f0;
  font-size: 0.88rem;
  line-height: 1.4;

  &:hover {
    color: #fff;
    text-decoration: underline;
  }
`

const FooterPolicyLink = styled(PolicyModalLink)`
  color: #dbe4f0;
  font-size: 0.88rem;
  font-weight: 400;
  line-height: 1.4;
  text-align: left;
  text-decoration: none;

  &:hover {
    color: #fff;
    text-decoration: underline;
  }
`

const ExternalLink = styled.a`
  color: #dbe4f0;
  font-size: 0.88rem;
  line-height: 1.4;

  &:hover {
    color: #fff;
    text-decoration: underline;
  }
`

const ContactItem = styled.span`
  color: #dbe4f0;
  font-size: 0.88rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
`

const Bottom = styled.div`
  border-top: 1px solid rgb(255 255 255 / 0.15);
`

const BottomInner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1rem;
  justify-content: space-between;
  color: #94a3b8;
  font-size: 0.78rem;
`

function IconeInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconeFacebook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7h2.4l.4-2.8h-2.8V9.4c0-.8.2-1.4 1.4-1.4h1.5V5.5c-.3 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.6v2.2H8.5V14h2.3v7h2.7Z" />
    </svg>
  )
}

function IconeWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.99L2 22l5.13-1.5A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.05.89.91-2.97-.2-.31a8.2 8.2 0 1 1 6.82 3.72Zm4.5-6.14c-.25-.13-1.47-.72-1.7-.8-.23-.09-.4-.13-.56.12-.17.25-.65.8-.8.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.1-.23-.16-.48-.29Z" />
    </svg>
  )
}

function IconeEmail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

function Footer() {
  const { pathname } = useLocation()
  const numero = useWhatsApp()

  // Área administrativa tem layout próprio; o rodapé é só do site público.
  if (pathname.startsWith('/admin')) return null

  const mensagem = 'Olá! Vim pelo site da IMF Turismo e gostaria de atendimento.'
  const ano = new Date().getFullYear()

  return (
    <Wrap>
      <Inner>
        <Brand>
          <BrandRow to="/" aria-label="IMF Turismo - Início">
            <LogoBox>
              <Logo src={logoUrl} alt="" />
            </LogoBox>
            <BrandName>
              <BrandIMF>IMF</BrandIMF> <BrandTurismo>Turismo</BrandTurismo>
            </BrandName>
          </BrandRow>
          <Tagline>{TAGLINE}</Tagline>
          <Socials>
            {INSTAGRAM_URL && (
              <SocialLink
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram da IMF Turismo"
              >
                <IconeInstagram />
              </SocialLink>
            )}
            {FACEBOOK_URL && (
              <SocialLink
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook da IMF Turismo"
              >
                <IconeFacebook />
              </SocialLink>
            )}
            <SocialLink
              href={linkWhatsApp(numero, mensagem)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Falar com a IMF Turismo no WhatsApp"
            >
              <IconeWhatsApp />
            </SocialLink>
            <SocialLink href={`mailto:${EMAIL_CONTATO}`} aria-label="Enviar e-mail para a IMF Turismo">
              <IconeEmail />
            </SocialLink>
          </Socials>
        </Brand>

        <Column>
          <ColumnTitle>Navegue</ColumnTitle>
          <FooterLink to="/">Início</FooterLink>
          <FooterLink to="/excursoes">Excursões</FooterLink>
          <FooterLink to="/sobre">Sobre nós</FooterLink>
          <FooterLink to="/minhas-reservas">Minhas Reservas</FooterLink>
          <FooterLink to="/perfil">Meu Perfil</FooterLink>
        </Column>

        <Column>
          <ColumnTitle>Suporte</ColumnTitle>
          <ExternalLink
            href={linkWhatsApp(numero, mensagem)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Fale no WhatsApp
          </ExternalLink>
          <ExternalLink href={`mailto:${EMAIL_CONTATO}`}>Envie um e-mail</ExternalLink>
          <FooterLink to="/perguntas-frequentes">Perguntas frequentes</FooterLink>
          <FooterPolicyLink>Política de Privacidade e Termos</FooterPolicyLink>
          <FooterLink to="/admin/login">Acesso da equipe</FooterLink>
        </Column>

        <Column>
          <ColumnTitle>Contato</ColumnTitle>
          <ContactItem>{formatarWhatsApp(numero)}</ContactItem>
          <ContactItem>{EMAIL_CONTATO}</ContactItem>
          {HORARIO_ATENDIMENTO && <ContactItem>{HORARIO_ATENDIMENTO}</ContactItem>}
          {!HORARIO_ATENDIMENTO && <ContactItem>Atendimento pelo WhatsApp</ContactItem>}
          {ENDERECO && <ContactItem>{ENDERECO}</ContactItem>}
        </Column>
      </Inner>

      <Bottom>
        <BottomInner>
          <span>© {ano} IMF Turismo. Todos os direitos reservados.</span>
          {CADASTUR && <span>CADASTUR {CADASTUR}</span>}
          {CNPJ && <span>CNPJ {CNPJ}</span>}
        </BottomInner>
      </Bottom>
    </Wrap>
  )
}

export default Footer

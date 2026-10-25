// ===========================================================================
// IMF TURISMO — barra de navegação pública (Página 1 do protótipo)
// Navbar branca fixa: logo à esquerda, links centralizados, avatar à direita.
// Item ativo com sublinhado azul, conforme os protótipos enviados.
// ===========================================================================

import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { useAuth } from '../lib/auth.jsx'
import { colors } from '../theme.js'
import logoUrl from '../assets/logo-imf-turismo.jfif'

const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: ${colors.background};
  border-bottom: 1px solid #e5e7eb;
`

const Inner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  /* Âncora do menu suspenso no celular. */
  position: relative;
`

const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-right: auto;
  color: ${colors.navy};
`

const Logo = styled.img`
  height: 84px;
  width: auto;
  object-fit: contain;

  @media (width <= 640px) {
    height: 56px;
  }
`

const BrandName = styled.span`
  font-size: 1.6rem;
  white-space: nowrap;

  @media (width <= 640px) {
    font-size: 1.15rem;
  }
`

const BrandIMF = styled.span`
  font-weight: 800;
`

const BrandTurismo = styled.span`
  font-weight: 400;
`

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 1.25rem;

  /* No celular os links viram um painel suspenso, aberto pelo botão ☰. */
  @media (width <= 960px) {
    display: ${(props) => (props.$aberto ? 'flex' : 'none')};
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    padding: 0.35rem 1rem 0.85rem;
    background-color: ${colors.background};
    border-bottom: 1px solid #e5e7eb;
    box-shadow: 0 12px 24px rgb(15 45 82 / 0.08);
  }
`

const navItemBase = css`
  font-size: 1rem;
  color: ${colors.navy};
  padding-bottom: 0.15rem;
  border-bottom: 2px solid transparent;

  @media (width <= 960px) {
    padding: 0.7rem 0;
    border-bottom: 1px solid #eef0f2;

    &:last-child {
      border-bottom: 0;
    }
  }
`

const NavItem = styled(NavLink)`
  ${navItemBase}

  &.active {
    font-weight: 700;
    border-bottom-color: ${colors.primary};

    @media (width <= 960px) {
      color: ${colors.primary};
      border-bottom-color: #eef0f2;
    }
  }
`

// "Excursões" leva à lista de pacotes na página inicial. Como o destino é o
// mesmo de "Início", usamos Link simples para não sublinhar os dois juntos.
const NavItemLink = styled(Link)`
  ${navItemBase}
`

const Avatar = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background-color: ${colors.inputBg};
  color: ${colors.navy};
  font-weight: 700;
  padding: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const MenuButton = styled.button`
  display: none;
  width: 40px;
  height: 40px;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: ${colors.background};
  color: ${colors.navy};
  align-items: center;
  justify-content: center;
  padding: 0;

  @media (width <= 960px) {
    display: inline-flex;
  }
`

function Navbar() {
  const { autenticado, ehAdmin, fotoPerfil } = useAuth()
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)
  // Admin não tem perfil de cliente (GET /api/perfil exige token de cliente),
  // então o link some para ele e entra o atalho de volta ao painel.
  const destinoAvatar = !autenticado ? '/login' : ehAdmin ? '/admin/dashboard' : '/perfil'

  // Fecha o painel suspenso ao escolher qualquer destino.
  function fecharMenu() {
    setMenuAberto(false)
  }

  function irParaAvatar() {
    fecharMenu()
    navigate(destinoAvatar)
  }

  return (
    <Bar>
      <Inner>
        <Brand to="/" aria-label="IMF Turismo - Início" onClick={fecharMenu}>
          <Logo src={logoUrl} alt="IMF Turismo" />
          <BrandName>
            <BrandIMF>IMF</BrandIMF> <BrandTurismo>Turismo</BrandTurismo>
          </BrandName>
        </Brand>
        <Nav id="menu-principal" $aberto={menuAberto}>
          <NavItem to="/" end onClick={fecharMenu}>
            Início
          </NavItem>
          <NavItemLink to="/#excursoes" onClick={fecharMenu}>
            Excursões
          </NavItemLink>
          <NavItem to="/sobre" onClick={fecharMenu}>
            Sobre nós
          </NavItem>
          <NavItem to="/perguntas-frequentes" onClick={fecharMenu}>
            Perguntas frequentes
          </NavItem>
          {!ehAdmin && (
            <NavItem to="/minhas-reservas" onClick={fecharMenu}>
              Minhas Reservas
            </NavItem>
          )}
          {!ehAdmin && (
            <NavItem to="/perfil" onClick={fecharMenu}>
              Perfil
            </NavItem>
          )}
          {ehAdmin && (
            <NavItem to="/admin/dashboard" onClick={fecharMenu}>
              Painel Admin
            </NavItem>
          )}
        </Nav>
        <Avatar
          type="button"
          aria-label={!autenticado ? 'Entrar' : ehAdmin ? 'Painel administrativo' : 'Meu perfil'}
          title={!autenticado ? 'Entrar' : ehAdmin ? 'Painel administrativo' : 'Meu perfil'}
          onClick={irParaAvatar}
        >
          {autenticado && !ehAdmin && fotoPerfil ? (
            <AvatarImage src={fotoPerfil} alt="Foto de perfil" />
          ) : autenticado ? (
            '●'
          ) : (
            '○'
          )}
        </Avatar>
        <MenuButton
          type="button"
          aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuAberto}
          aria-controls="menu-principal"
          onClick={() => setMenuAberto((aberto) => !aberto)}
        >
          {menuAberto ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </MenuButton>
      </Inner>
    </Bar>
  )
}

export default Navbar

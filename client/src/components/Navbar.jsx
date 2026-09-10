// ===========================================================================
// IMF TURISMO — barra de navegação pública (Página 1 do protótipo)
// Navbar branca fixa: logo à esquerda, links centralizados, avatar à direita.
// Item ativo com sublinhado azul, conforme os protótipos enviados.
// ===========================================================================

import { Link, NavLink, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
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
`

const BrandName = styled.span`
  font-size: 1.6rem;
  white-space: nowrap;
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
`

const NavItem = styled(NavLink)`
  font-size: 1rem;
  color: ${colors.navy};
  padding-bottom: 0.15rem;
  border-bottom: 2px solid transparent;

  &.active {
    font-weight: 700;
    border-bottom-color: ${colors.primary};
  }
`

const Avatar = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background-color: ${colors.inputBg};
  color: ${colors.navy};
  font-weight: 700;
`

function Navbar() {
  const { autenticado, ehAdmin } = useAuth()
  const navigate = useNavigate()
  // Admin não tem perfil de cliente (GET /api/perfil exige token de cliente),
  // então o link some para ele e entra o atalho de volta ao painel.
  const destinoAvatar = !autenticado ? '/login' : ehAdmin ? '/admin/dashboard' : '/perfil'
  return (
    <Bar>
      <Inner>
        <Brand to="/" aria-label="IMF Turismo - Início">
          <Logo src={logoUrl} alt="IMF Turismo" />
          <BrandName>
            <BrandIMF>IMF</BrandIMF> <BrandTurismo>Turismo</BrandTurismo>
          </BrandName>
        </Brand>
        <Nav>
          <NavItem to="/" end>
            Início
          </NavItem>
          <NavItem to="/" end>
            Excursões
          </NavItem>
          <NavItem to="/minhas-reservas">Minhas Reservas</NavItem>
          {!ehAdmin && <NavItem to="/perfil">Perfil</NavItem>}
          {ehAdmin && <NavItem to="/admin/dashboard">Painel Admin</NavItem>}
        </Nav>
        <Avatar
          type="button"
          aria-label={!autenticado ? 'Entrar' : ehAdmin ? 'Painel administrativo' : 'Meu perfil'}
          title={!autenticado ? 'Entrar' : ehAdmin ? 'Painel administrativo' : 'Meu perfil'}
          onClick={() => navigate(destinoAvatar)}
        >
          {autenticado ? '●' : '○'}
        </Avatar>
      </Inner>
    </Bar>
  )
}

export default Navbar

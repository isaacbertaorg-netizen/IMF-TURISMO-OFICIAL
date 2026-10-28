// ===========================================================================
// IMF TURISMO — moldura administrativa (Páginas 5 e 6 do protótipo)
// Sidebar azul-marinho fixa à esquerda; conteúdo à direita. Os nomes dos
// itens foram simplificados para facilitar o uso pela equipe da IMF.
// ===========================================================================

import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useAuth } from '../lib/auth.jsx'
import { colors } from '../theme.js'

const Wrap = styled.div`
  display: flex;
  min-height: calc(100vh - 65px);
`

const Sidebar = styled.aside`
  width: 230px;
  flex-shrink: 0;
  background-color: ${colors.navy};
  color: #fff;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;

  @media (width <= 720px) {
    width: 170px;
  }
`

const Brand = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid rgb(255 255 255 / 0.15);
`

const BrandName = styled.strong`
  color: #fff;
  font-size: 1.05rem;
`

const BrandSub = styled.span`
  color: #94a3b8;
  font-size: 0.75rem;
`

const SideItem = styled(NavLink)`
  color: #dbe4f0;
  font-size: 0.95rem;

  &.active {
    color: #fff;
    font-weight: 700;
  }

  &:hover {
    color: #fff;
    text-decoration: underline;
  }
`

const SiteLink = styled(Link)`
  margin-top: auto;
  padding-top: 1rem;
  color: #dbe4f0;
  font-size: 0.85rem;

  &:hover {
    color: #fff;
    text-decoration: underline;
  }
`

const Content = styled.main`
  flex: 1;
  padding: 1.5rem;
  background-color: ${colors.backgroundAlt};
  min-width: 0;
`

const OutButton = styled.button`
  border: 0;
  border-top: 1px solid rgb(255 255 255 / 0.15);
  background: transparent;
  color: #dbe4f0;
  text-align: left;
  font-size: 0.95rem;
  padding: 0.9rem 0 0;
  cursor: pointer;

  &:hover {
    color: #fff;
    text-decoration: underline;
  }
`

function AdminLayout() {
  const { sair } = useAuth()
  const navigate = useNavigate()

  function encerrar() {
    sair()
    navigate('/admin/login', { replace: true })
  }

  return (
    <Wrap>
      <Sidebar>
        <Brand>
          <BrandName>IMF Turismo</BrandName>
          <BrandSub>Painel da equipe</BrandSub>
        </Brand>
        <SideItem to="/admin/dashboard">Visão geral</SideItem>
        <SideItem to="/admin/excursoes">Excursões</SideItem>
        <SideItem to="/admin/reservas">Reservas</SideItem>
        <SideItem to="/admin/clientes">Clientes</SideItem>
        <SiteLink to="/" target="_blank" rel="noreferrer">
          Ver site
        </SiteLink>
        <OutButton type="button" onClick={encerrar}>
          Sair da conta
        </OutButton>
      </Sidebar>
      <Content>
        <Outlet />
      </Content>
    </Wrap>
  )
}

export default AdminLayout

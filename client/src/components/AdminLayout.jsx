// ===========================================================================
// IMF TURISMO — moldura administrativa (Páginas 5 e 6 do protótipo)
// Sidebar azul-marinho fixa à esquerda; conteúdo à direita. Itens em texto
// claro, sem ícones (seção 2.1 do PRODUCT.md).
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

const SideItem = styled(NavLink)`
  color: #dbe4f0;
  font-size: 0.95rem;

  &.active {
    color: #fff;
    font-weight: 700;
  }
`

const Content = styled.main`
  flex: 1;
  padding: 1.5rem;
  background-color: ${colors.backgroundAlt};
  min-width: 0;
`

const OutButton = styled.button`
  margin-top: auto;
  border: 0;
  background: transparent;
  color: #dbe4f0;
  text-align: left;
  font-size: 0.95rem;
  padding: 0;
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
        <SideItem to="/admin/dashboard">Painel Administrativo</SideItem>
        <SideItem to="/admin/excursoes">Excursões</SideItem>
        <SideItem to="/admin/clientes">Clientes ＞</SideItem>
        <SideItem to="/admin/reservas">Reservas ＞</SideItem>
        <OutButton type="button" onClick={encerrar}>
          Sair
        </OutButton>
      </Sidebar>
      <Content>
        <Outlet />
      </Content>
    </Wrap>
  )
}

export default AdminLayout
export { Link }

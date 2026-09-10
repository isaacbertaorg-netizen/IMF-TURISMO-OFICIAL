// ===========================================================================
// IMF TURISMO — rotas do front-end (seções 3.1 a 3.11 do PRODUCT.md)
// Públicas: /, /excursoes/:id, /login, /cadastro. Cliente: /excursoes/:id/
// reservar, /minhas-reservas, /perfil (ProtectedRoute). Admin: /admin/login
// (oculta) e /admin/* (AdminRoute com sidebar).
// ===========================================================================

import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import styled from 'styled-components'
import AdminLayout from './components/AdminLayout.jsx'
import Navbar from './components/Navbar.jsx'
import { AdminRoute, ClienteRoute, ProtectedRoute } from './components/ProtectedRoute.jsx'
import { AuthProvider } from './lib/auth.jsx'
import AdminClientes from './pages/AdminClientes.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminExcursoes from './pages/AdminExcursoes.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminReservas from './pages/AdminReservas.jsx'
import Cadastro from './pages/Cadastro.jsx'
import ExcursionDetails from './pages/ExcursionDetails.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import MinhasReservas from './pages/MinhasReservas.jsx'
import Perfil from './pages/Perfil.jsx'
import Reserva from './pages/Reserva.jsx'
import { colors } from './theme.js'

const NotFoundWrap = styled.main`
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 1rem;
  text-align: center;
  color: ${colors.textMuted};
`

function NotFound() {
  return (
    <NotFoundWrap>
      <p>Página não encontrada.</p>
      <Link to="/">Voltar à página inicial</Link>
    </NotFoundWrap>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/excursoes/:id" element={<ExcursionDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route
            path="/excursoes/:id/reservar"
            element={
              <ProtectedRoute>
                <Reserva />
              </ProtectedRoute>
            }
          />
          <Route
            path="/minhas-reservas"
            element={
              <ProtectedRoute>
                <MinhasReservas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ClienteRoute>
                <Perfil />
              </ClienteRoute>
            }
          />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="excursoes" element={<AdminExcursoes />} />
            <Route path="reservas" element={<AdminReservas />} />
            <Route path="clientes" element={<AdminClientes />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

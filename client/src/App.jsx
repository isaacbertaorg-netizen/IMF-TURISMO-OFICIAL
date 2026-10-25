// ===========================================================================
// IMF TURISMO — rotas do front-end (seções 3.1 a 3.11 do PRODUCT.md)
// Públicas: /, /excursoes, /excursoes/:id, /login, /cadastro. Cliente: /excursoes/:id/
// reservar, /minhas-reservas, /perfil (ProtectedRoute). Admin: /admin/login
// (oculta) e /admin/* (AdminRoute com sidebar).
// ===========================================================================

import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import styled from 'styled-components'
import AdminLayout from './components/AdminLayout.jsx'
import Footer from './components/Footer.jsx'
import Navbar from './components/Navbar.jsx'
import { AdminRoute, ClienteRoute, ProtectedRoute } from './components/ProtectedRoute.jsx'
import { AuthProvider } from './lib/auth.jsx'
import AdminClientes from './pages/AdminClientes.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminExcursoes from './pages/AdminExcursoes.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminReservas from './pages/AdminReservas.jsx'
import Cadastro from './pages/Cadastro.jsx'
import EsqueciSenha from './pages/EsqueciSenha.jsx'
import Excursoes from './pages/Excursoes.jsx'
import ExcursionDetails from './pages/ExcursionDetails.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import MinhasReservas from './pages/MinhasReservas.jsx'
import PerguntasFrequentes from './pages/PerguntasFrequentes.jsx'
import Perfil from './pages/Perfil.jsx'
import PoliticaPrivacidade from './pages/PoliticaPrivacidade.jsx'
import RedefinirSenha from './pages/RedefinirSenha.jsx'
import Reserva from './pages/Reserva.jsx'
import Sobre from './pages/Sobre.jsx'
import { colors } from './theme.js'

const NotFoundWrap = styled.main`
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 1rem;
  text-align: center;
  color: ${colors.textMuted};
`

// Coluna de altura mínima: em páginas curtas o rodapé (margin-top: auto)
// desce até o fim da tela em vez de ficar logo abaixo do conteúdo.
const Shell = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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
        <Shell>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/excursoes" element={<Excursoes />} />
            <Route path="/excursoes/:id" element={<ExcursionDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/esqueci-senha" element={<EsqueciSenha />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/perguntas-frequentes" element={<PerguntasFrequentes />} />
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
                <ClienteRoute>
                  <MinhasReservas />
                </ClienteRoute>
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
          <Footer />
        </Shell>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

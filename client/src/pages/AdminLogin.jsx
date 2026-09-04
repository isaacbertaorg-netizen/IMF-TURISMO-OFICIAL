// ===========================================================================
// IMF TURISMO — Login administrativo (rota oculta /admin/login, seção 3.7)
// Sem link visível na navegação pública. Valida login_admin + senha e exige
// papel ADMIN nas rotas seguintes (403 para cliente comum).
// ===========================================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout, { ErrorText, PillInput, PrimaryButton } from '../components/AuthLayout.jsx'
import { mensagemErro } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import fundoLogin from '../assets/fundo-login.jpg'

function AdminLogin() {
  const { loginAdmin } = useAuth()
  const navigate = useNavigate()
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function entrar(event) {
    event.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await loginAdmin(login.trim(), senha)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setErro(mensagemErro(err, 'Login ou senha inválidos.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout fundo={fundoLogin}>
      <form onSubmit={entrar} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <PillInput placeholder="Login administrativo" required minLength={3} value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" />
        <PillInput type="password" placeholder="Senha" required minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" />
        {erro && <ErrorText>{erro}</ErrorText>}
        <PrimaryButton type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </PrimaryButton>
      </form>
    </AuthLayout>
  )
}

export default AdminLogin

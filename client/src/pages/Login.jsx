// ===========================================================================
// IMF TURISMO — Login do cliente (Página 2, seção 3.3)
// Fundo fundo-login.jpg + card branco. O back-end autentica por e-mail + senha
// (schema LoginRequest); o rótulo "Login" do protótipo aceita o e-mail.
// ===========================================================================

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import AuthLayout, { ErrorText, PillInput, PrimaryButton } from '../components/AuthLayout.jsx'
import { mensagemErro } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { colors } from '../theme.js'
import fundoLogin from '../assets/fundo-login.jpg'

const Forgot = styled.span`
  color: ${colors.navy};
  font-weight: 700;
  font-size: 0.8rem;
`

const Signup = styled.p`
  font-size: 0.85rem;
  color: ${colors.textMuted};
`

function Login() {
  const { loginCliente } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function entrar(event) {
    event.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await loginCliente(email.trim(), senha)
      navigate(location.state?.from ?? '/', { replace: true })
    } catch (err) {
      // Mensagem do back sem expor detalhes internos.
      setErro(mensagemErro(err, 'E-mail ou senha inválidos.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout fundo={fundoLogin}>
      <form onSubmit={entrar} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <PillInput
          type="email"
          required
          placeholder="Login (seu e-mail)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <PillInput
          type="password"
          required
          minLength={6}
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password"
        />
        <Forgot>Esqueci minha senha</Forgot>
        {erro && <ErrorText>{erro}</ErrorText>}
        <PrimaryButton type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </PrimaryButton>
      </form>
      <Signup>
        Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
      </Signup>
    </AuthLayout>
  )
}

export default Login

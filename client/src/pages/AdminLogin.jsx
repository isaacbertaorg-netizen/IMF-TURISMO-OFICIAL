// ===========================================================================
// IMF TURISMO — Login administrativo (rota /admin/login, seção 3.7)
// Acesso restrito à equipe. A tela explica o que fazer, mostra a senha e
// oferece um canal de ajuda para quem não é da área técnica.
// ===========================================================================

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import AuthLayout, { ErrorText, PillInput, PrimaryButton } from '../components/AuthLayout.jsx'
import PasswordInput from '../components/PasswordInput.jsx'
import { mensagemErro } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { linkWhatsApp } from '../lib/whatsapp.js'
import { useWhatsApp } from '../lib/useWhatsApp.js'
import { colors } from '../theme.js'
import fundoLogin from '../assets/fundo-login.jpg'

const Titulo = styled.h2`
  color: ${colors.navy};
  font-size: 1.35rem;
  text-align: center;
`

const Texto = styled.p`
  color: ${colors.textMuted};
  font-size: 0.88rem;
  line-height: 1.5;
  text-align: center;
`

const Ajuda = styled.p`
  color: ${colors.textMuted};
  font-size: 0.8rem;
  line-height: 1.5;
  text-align: center;
`

const AjudaLink = styled.a`
  color: ${colors.primary};
  font-weight: 700;
  text-decoration: underline;
`

const Voltar = styled(Link)`
  color: ${colors.navy};
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`

function AdminLogin() {
  const { loginAdmin } = useAuth()
  const navigate = useNavigate()
  const numero = useWhatsApp()
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const mensagemAjuda =
    'Olá! Preciso de ajuda para acessar o painel da equipe da IMF Turismo.'

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
      <Titulo>Área da equipe IMF</Titulo>
      <Texto>
        Use o usuário e a senha fornecidos pela administração. Este acesso é exclusivo para
        gerenciar excursões, reservas e clientes.
      </Texto>
      <form
        onSubmit={entrar}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          alignItems: 'center',
        }}
      >
        <PillInput
          autoFocus
          placeholder="Usuário da equipe"
          required
          minLength={3}
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
        />
        <PasswordInput
          placeholder="Senha"
          required
          minLength={6}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password"
        />
        {erro && <ErrorText>{erro}</ErrorText>}
        <PrimaryButton type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar no painel'}
        </PrimaryButton>
      </form>

      <Ajuda>
        Esqueceu a senha ou precisa de ajuda?{' '}
        <AjudaLink
          href={linkWhatsApp(numero, mensagemAjuda)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Falar com o suporte
        </AjudaLink>
      </Ajuda>
      <Voltar to="/">Voltar ao site</Voltar>
    </AuthLayout>
  )
}

export default AdminLogin

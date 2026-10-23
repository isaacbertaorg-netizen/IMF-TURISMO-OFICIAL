// ===========================================================================
// IMF TURISMO — Recuperação de senha (etapa 1: pedir o link)
// O back-end responde sempre a mesma mensagem, exista ou não o e-mail, para
// não revelar quais endereços estão cadastrados (enumeração de usuários).
// ===========================================================================

import { useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import AuthLayout, {
  ErrorText,
  PillInput,
  PrimaryButton,
  SuccessText,
} from '../components/AuthLayout.jsx'
import { api, mensagemErro } from '../lib/api.js'
import { colors } from '../theme.js'
import fundoLogin from '../assets/fundo-login.jpg'

const Titulo = styled.h2`
  color: ${colors.navy};
  font-size: 1.25rem;
  text-align: center;
`

const Texto = styled.p`
  color: ${colors.textMuted};
  font-size: 0.85rem;
  text-align: center;
  line-height: 1.5;
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

function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function solicitar(event) {
    event.preventDefault()
    setErro('')
    setMensagem('')
    setEnviando(true)
    try {
      const { data } = await api.post('/api/esqueci-senha', { email: email.trim() })
      setMensagem(data.mensagem)
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível enviar o link. Tente novamente.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout fundo={fundoLogin}>
      <Titulo>Recuperar senha</Titulo>
      <Texto>
        Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha.
      </Texto>
      <form
        onSubmit={solicitar}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          alignItems: 'center',
        }}
      >
        <PillInput
          type="email"
          required
          placeholder="E-mail cadastrado"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        {erro && <ErrorText>{erro}</ErrorText>}
        {mensagem && <SuccessText>{mensagem}</SuccessText>}
        <PrimaryButton type="submit" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar link'}
        </PrimaryButton>
      </form>
      <Voltar to="/login">Voltar ao login</Voltar>
    </AuthLayout>
  )
}

export default EsqueciSenha

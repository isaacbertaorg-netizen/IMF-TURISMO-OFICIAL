// ===========================================================================
// IMF TURISMO — Recuperação de senha (etapa 2: criar a nova senha)
// O token chega pela URL (?token=...), enviado no e-mail. Ele é de uso único
// e expira: o back-end recusa token inválido, expirado ou já utilizado.
// ===========================================================================

import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import AuthLayout, {
  ErrorText,
  PrimaryButton,
  SuccessText,
} from '../components/AuthLayout.jsx'
import PasswordInput from '../components/PasswordInput.jsx'
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

function RedefinirSenha() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function salvar(event) {
    event.preventDefault()
    setErro('')
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }
    setEnviando(true)
    try {
      const { data } = await api.post('/api/redefinir-senha', {
        token,
        senha,
        confirmar_senha: confirmarSenha,
      })
      setMensagem(data.mensagem)
    } catch (err) {
      setErro(mensagemErro(err, 'Link inválido ou expirado. Solicite um novo.'))
    } finally {
      setEnviando(false)
    }
  }

  // Sem token na URL não há o que redefinir: orienta a pedir um novo link.
  if (!token) {
    return (
      <AuthLayout fundo={fundoLogin}>
        <Titulo>Link inválido</Titulo>
        <Texto>
          O link de redefinição está incompleto. Solicite um novo e-mail para continuar.
        </Texto>
        <Voltar to="/esqueci-senha">Solicitar novo link</Voltar>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout fundo={fundoLogin}>
      <Titulo>Criar nova senha</Titulo>
      <Texto>Escolha uma senha com pelo menos 6 caracteres.</Texto>
      {mensagem ? (
        <>
          <SuccessText>{mensagem}</SuccessText>
          <Voltar to="/login">Ir para o login</Voltar>
        </>
      ) : (
        <form
          onSubmit={salvar}
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            alignItems: 'center',
          }}
        >
          <PasswordInput
            required
            minLength={6}
            placeholder="Nova senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="new-password"
          />
          <PasswordInput
            required
            minLength={6}
            placeholder="Confirme a nova senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            autoComplete="new-password"
          />
          {erro && <ErrorText>{erro}</ErrorText>}
          <PrimaryButton type="submit" disabled={enviando}>
            {enviando ? 'Salvando…' : 'Redefinir senha'}
          </PrimaryButton>
        </form>
      )}
      {!mensagem && <Voltar to="/login">Voltar ao login</Voltar>}
    </AuthLayout>
  )
}

export default RedefinirSenha

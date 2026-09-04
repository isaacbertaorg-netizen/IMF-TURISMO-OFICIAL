// ===========================================================================
// IMF TURISMO — Cadastro do cliente (Página 3, seção 3.3 + RF03)
// Nome, CPF, e-mail, telefone e endereço dividido (CEP com busca ViaCEP,
// rua, número, complemento, bairro, cidade, UF) + senha.
// Validação de senhas idênticas no front e no back.
// ===========================================================================

import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import AuthLayout, { ErrorText, PillInput, PrimaryButton } from '../components/AuthLayout.jsx'
import EnderecoForm from '../components/EnderecoForm.jsx'
import { api, mensagemErro } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { apenasDigitos, formatarCPF, formatarTelefone } from '../lib/mascaras.js'
import { colors } from '../theme.js'
import fundoCadastro from '../assets/fundo-cadastro.webp'

const Hint = styled.p`
  font-size: 0.85rem;
  color: ${colors.textMuted};
  text-align: center;
`

const CAMPOS_VAZIOS = {
  nome: '',
  cpf: '',
  email: '',
  telefone: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  senha: '',
  confirmar_senha: '',
}

function Cadastro() {
  const { loginCliente } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(CAMPOS_VAZIOS)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const atualizar = useCallback((campo, valor) => {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }, [])

  async function criarConta(event) {
    event.preventDefault()
    setErro('')
    if (form.senha !== form.confirmar_senha) {
      setErro('As senhas não coincidem.')
      return
    }
    setEnviando(true)
    try {
      await api.post('/api/cadastro', {
        nome: form.nome.trim(),
        cpf: apenasDigitos(form.cpf),
        email: form.email.trim(),
        telefone: form.telefone.trim(),
        cep: apenasDigitos(form.cep),
        logradouro: form.logradouro.trim(),
        numero: form.numero.trim(),
        complemento: form.complemento.trim(),
        bairro: form.bairro.trim(),
        cidade: form.cidade.trim(),
        uf: form.uf.trim().toUpperCase(),
        senha: form.senha,
        confirmar_senha: form.confirmar_senha,
      })
      // Conta criada; autentica em seguida para entrar direto.
      await loginCliente(form.email.trim(), form.senha)
      navigate('/', { replace: true })
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível criar a conta. Revise os dados.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout fundo={fundoCadastro}>
      <form onSubmit={criarConta} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'center' }}>
        <PillInput placeholder="Nome completo" required minLength={3} value={form.nome} onChange={(e) => atualizar('nome', e.target.value)} autoComplete="name" />
        <PillInput placeholder="CPF (000.000.000-00)" required inputMode="numeric" maxLength={14} value={form.cpf} onChange={(e) => atualizar('cpf', formatarCPF(e.target.value))} />
        <PillInput type="email" placeholder="E-mail" required value={form.email} onChange={(e) => atualizar('email', e.target.value)} autoComplete="email" />
        <PillInput placeholder="Telefone (+55 (DD) 90000-0000)" required inputMode="tel" maxLength={19} value={form.telefone} onChange={(e) => atualizar('telefone', formatarTelefone(e.target.value))} autoComplete="tel" />
        <EnderecoForm valores={form} onChange={atualizar} />
        <PillInput type="password" placeholder="Senha (mín. 6)" required minLength={6} value={form.senha} onChange={(e) => atualizar('senha', e.target.value)} autoComplete="new-password" />
        <PillInput type="password" placeholder="Confirme sua senha" required minLength={6} value={form.confirmar_senha} onChange={(e) => atualizar('confirmar_senha', e.target.value)} autoComplete="new-password" />
        {erro && <ErrorText>{erro}</ErrorText>}
        <PrimaryButton type="submit" disabled={enviando}>
          {enviando ? 'Criando…' : 'Criar conta'}
        </PrimaryButton>
      </form>
      <Hint>
        Já tem conta? <Link to="/login">Entrar</Link>
      </Hint>
    </AuthLayout>
  )
}

export default Cadastro

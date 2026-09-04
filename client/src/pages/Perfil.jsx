// ===========================================================================
// IMF TURISMO — Perfil do Cliente (seção 3.6 do PRODUCT.md)
// Exibe e edita nome, telefone e endereço (GET/PUT /api/perfil).
// CPF e e-mail são chave de identificação e nunca editáveis.
// ===========================================================================

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import EnderecoForm from '../components/EnderecoForm.jsx'
import { api, mensagemErro } from '../lib/api.js'
import { apenasDigitos, formatarTelefone } from '../lib/mascaras.js'
import { useAuth } from '../lib/auth.jsx'
import { colors } from '../theme.js'

const Page = styled.main`
  max-width: 640px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
`

const Title = styled.h1`
  color: ${colors.navy};
  font-weight: 800;
  font-size: 2rem;
  margin-bottom: 1.25rem;
`

const Card = styled.section`
  background-color: ${colors.background};
  border-radius: 1rem;
  box-shadow: 0 8px 24px rgb(15 45 82 / 0.08);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1rem;
`

const Label = styled.label`
  color: ${colors.navy};
  font-size: 0.85rem;
  font-weight: 600;
`

const Fixo = styled.p`
  color: ${colors.textMuted};
  font-size: 0.9rem;
`

const PillInput = styled.input`
  width: 100%;
  border: 0;
  border-radius: 999px;
  background-color: ${colors.inputBg};
  padding: 0.65rem 1.1rem;
  color: ${colors.navy};
`

const SaveButton = styled.button`
  border: 0;
  border-radius: 999px;
  background-color: ${colors.primary};
  color: #fff;
  font-weight: 700;
  padding: 0.65rem 1.6rem;
  align-self: flex-start;
`

const OutButton = styled.button`
  border: 0;
  border-radius: 999px;
  background-color: transparent;
  color: ${colors.textMuted};
  padding: 0.6rem 1rem;
  align-self: flex-start;
`

const Feedback = styled.p`
  color: ${colors.textMuted};
  text-align: center;
`

const ErrorText = styled.p`
  color: ${colors.danger};
  font-size: 0.9rem;
`

const OkText = styled.p`
  color: ${colors.successDark};
  font-size: 0.9rem;
`

function Perfil() {
  const { sair } = useAuth()
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
  })
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    async function carregar() {
      try {
        const resp = await api.get('/api/perfil')
        setPerfil(resp.data)
        setForm({
          nome: resp.data.nome_cliente ?? '',
          telefone: resp.data.telefone ?? '',
          cep: resp.data.cep ?? '',
          logradouro: resp.data.logradouro ?? '',
          numero: resp.data.numero ?? '',
          complemento: resp.data.complemento ?? '',
          bairro: resp.data.bairro ?? '',
          cidade: resp.data.cidade ?? '',
          uf: resp.data.uf ?? '',
        })
      } catch (err) {
        setErro(mensagemErro(err, 'Não foi possível carregar o perfil.'))
      }
    }
    carregar()
  }, [])

  const atualizar = useCallback((campo, valor) => {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }, [])

  async function salvar(event) {
    event.preventDefault()
    setErro('')
    setOk('')
    setSalvando(true)
    try {
      const resp = await api.put('/api/perfil', {
        nome: form.nome.trim(),
        telefone: form.telefone.trim(),
        cep: apenasDigitos(form.cep),
        logradouro: form.logradouro.trim(),
        numero: form.numero.trim(),
        complemento: form.complemento.trim(),
        bairro: form.bairro.trim(),
        cidade: form.cidade.trim(),
        uf: form.uf.trim().toUpperCase(),
      })
      setPerfil(resp.data)
      setOk('Dados atualizados.')
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível salvar.'))
    } finally {
      setSalvando(false)
    }
  }

  function encerrar() {
    sair()
    navigate('/', { replace: true })
  }

  return (
    <Page>
      <Title>Perfil</Title>
      {!perfil && !erro && <Feedback>Carregando…</Feedback>}
      {erro && !perfil && <ErrorText>{erro}</ErrorText>}
      {perfil && (
        <Card>
          <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <Label>Nome completo</Label>
            <PillInput required minLength={3} value={form.nome} onChange={(e) => atualizar('nome', e.target.value)} />
            <Label>Telefone</Label>
            <PillInput
              required
              inputMode="tel"
              maxLength={19}
              value={form.telefone}
              onChange={(e) => atualizar('telefone', formatarTelefone(e.target.value))}
            />
            <Label>Endereço</Label>
            <EnderecoForm valores={form} onChange={atualizar} />
            <Label>CPF (não editável)</Label>
            <Fixo>{perfil.cpf}</Fixo>
            <Label>E-mail (não editável)</Label>
            <Fixo>{perfil.email}</Fixo>
            {erro && <ErrorText>{erro}</ErrorText>}
            {ok && <OkText>{ok}</OkText>}
            <SaveButton type="submit" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar alterações'}
            </SaveButton>
          </form>
        </Card>
      )}
      <OutButton type="button" onClick={encerrar}>
        Sair
      </OutButton>
    </Page>
  )
}

export default Perfil

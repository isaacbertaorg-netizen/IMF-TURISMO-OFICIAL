// ===========================================================================
// IMF TURISMO — Perfil do Cliente (seção 3.6 do PRODUCT.md)
// Exibe e edita nome, telefone e endereço (GET/PUT /api/perfil), a foto do
// avatar e as autorizações LGPD. CPF e e-mail são chave de identificação e
// nunca editáveis.
// ===========================================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import EnderecoForm from '../components/EnderecoForm.jsx'
import EditorFoto from '../components/EditorFoto.jsx'
import PolicyModalLink from '../components/PolicyModal.jsx'
import { api, formatarDataHoraLocal, mensagemErro } from '../lib/api.js'
import { apenasDigitos, formatarTelefone } from '../lib/mascaras.js'
import { useAuth } from '../lib/auth.jsx'
import { colors } from '../theme.js'

const LIMITE_FOTO_MB = 4
const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp']

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

const PhotoCard = styled.section`
  background-color: ${colors.background};
  border-radius: 1rem;
  box-shadow: 0 8px 24px rgb(15 45 82 / 0.08);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
`

const PhotoPreview = styled.img`
  width: 96px;
  height: 96px;
  border-radius: 999px;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 4px 14px rgb(15 45 82 / 0.18);
`

const PhotoPlaceholder = styled.div`
  width: 96px;
  height: 96px;
  border-radius: 999px;
  background-color: ${colors.primary};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 800;
`

const PhotoInfo = styled.div`
  flex: 1;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`

const PhotoTitle = styled.h2`
  color: ${colors.navy};
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0;
`

const Hint = styled.p`
  color: ${colors.textMuted};
  font-size: 0.82rem;
  margin: 0;
`

const PhotoActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`

const PhotoButton = styled.button`
  border: 0;
  border-radius: 999px;
  background-color: ${colors.primary};
  color: #fff;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 0.55rem 1.1rem;
`

const RemoveButton = styled.button`
  border: 0;
  border-radius: 999px;
  background-color: transparent;
  color: ${colors.danger};
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.55rem 0.8rem;
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

const ConsentTitle = styled.h2`
  color: ${colors.navy};
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0;
`

const ConsentIntro = styled.p`
  color: ${colors.textMuted};
  font-size: 0.88rem;
  line-height: 1.45;
  margin: 0;
`

const ConsentForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.25rem;
`

const ConsentRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;

  input {
    width: 1.1rem;
    height: 1.1rem;
    margin-top: 0.2rem;
    accent-color: ${colors.primary};
    flex-shrink: 0;
  }
`

const ConsentText = styled.span`
  color: ${colors.navy};
  font-size: 0.9rem;
  line-height: 1.45;
`

const ConsentStatus = styled.span`
  display: block;
  color: ${colors.textMuted};
  font-size: 0.78rem;
  margin-left: 1.7rem;
`

const PolicyLink = styled(PolicyModalLink)`
  color: ${colors.primary};
  font-weight: 600;
  text-decoration: underline;
`

const ConsentNote = styled.p`
  color: ${colors.textMuted};
  font-size: 0.78rem;
  line-height: 1.4;
  margin: 0;
`

function statusConsentimento(perfil, campo) {
  const em = perfil?.[`${campo}_em`]
  if (!em) return ''
  return `${perfil[campo] ? 'Autorizado' : 'Revogado'} em ${formatarDataHoraLocal(em)}.`
}

function statusAceite(perfil) {
  if (!perfil?.aceite_privacidade) return 'Aceite pendente.'
  return perfil.aceite_privacidade_em
    ? `Aceite registrado em ${formatarDataHoraLocal(perfil.aceite_privacidade_em)}.`
    : 'Aceite registrado.'
}

function Perfil() {
  const { sair, atualizarFotoPerfil } = useAuth()
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
  const [consentimentos, setConsentimentos] = useState({
    aceite_privacidade: false,
    consentimento_imagem: false,
    consentimento_marketing: false,
    consentimento_compartilhamento: false,
  })
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erroFoto, setErroFoto] = useState('')
  const [okFoto, setOkFoto] = useState('')
  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const [arquivoEdicao, setArquivoEdicao] = useState(null)
  const [erroConsentimentos, setErroConsentimentos] = useState('')
  const [okConsentimentos, setOkConsentimentos] = useState('')
  const [salvandoConsentimentos, setSalvandoConsentimentos] = useState(false)
  const arquivoRef = useRef(null)

  function preencherConsentimentos(dados) {
    setConsentimentos({
      aceite_privacidade: Boolean(dados.aceite_privacidade),
      consentimento_imagem: Boolean(dados.consentimento_imagem),
      consentimento_marketing: Boolean(dados.consentimento_marketing),
      consentimento_compartilhamento: Boolean(dados.consentimento_compartilhamento),
    })
  }

  useEffect(() => {
    async function carregar() {
      try {
        const resp = await api.get('/api/perfil')
        setPerfil(resp.data)
        preencherConsentimentos(resp.data)
        // Mantém o avatar da navbar sincronizado também em sessões antigas,
        // abertas antes da foto existir no localStorage.
        atualizarFotoPerfil(resp.data.foto_perfil_url ?? null)
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
  }, [atualizarFotoPerfil])

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

  // A validação acontece ao escolher o arquivo; o upload só ocorre depois
  // que o cliente confirma o enquadramento no editor.
  function selecionarFoto(event) {
    const arquivo = event.target.files?.[0]
    // Limpa o input para permitir escolher o mesmo arquivo de novo.
    event.target.value = ''
    if (!arquivo) return

    setErroFoto('')
    setOkFoto('')
    if (!TIPOS_FOTO.includes(arquivo.type)) {
      setErroFoto('Envie uma imagem JPG, PNG ou WebP.')
      return
    }
    if (arquivo.size > LIMITE_FOTO_MB * 1024 * 1024) {
      setErroFoto(`A imagem deve ter no máximo ${LIMITE_FOTO_MB} MB.`)
      return
    }
    setArquivoEdicao(arquivo)
  }

  async function salvarFotoEditada(blob) {
    setErroFoto('')
    setOkFoto('')

    const dados = new FormData()
    dados.append('arquivo', blob, 'perfil.jpg')
    setEnviandoFoto(true)
    try {
      const resp = await api.post('/api/perfil/foto', dados)
      setPerfil(resp.data)
      atualizarFotoPerfil(resp.data.foto_perfil_url)
      setOkFoto('Foto atualizada.')
      setArquivoEdicao(null)
    } catch (err) {
      // Mantém o editor aberto para o cliente tentar de novo sem perder o
      // enquadramento escolhido.
      setErroFoto(mensagemErro(err, 'Não foi possível enviar a foto.'))
    } finally {
      setEnviandoFoto(false)
    }
  }

  async function removerFoto() {
    if (!window.confirm('Remover sua foto de perfil?')) return
    setErroFoto('')
    setOkFoto('')
    setEnviandoFoto(true)
    try {
      const resp = await api.delete('/api/perfil/foto')
      setPerfil(resp.data)
      atualizarFotoPerfil(null)
      setOkFoto('Foto removida.')
    } catch (err) {
      setErroFoto(mensagemErro(err, 'Não foi possível remover a foto.'))
    } finally {
      setEnviandoFoto(false)
    }
  }

  function atualizarConsentimento(campo, valor) {
    setConsentimentos((atual) => ({ ...atual, [campo]: valor }))
  }

  async function salvarConsentimentos(event) {
    event.preventDefault()
    setErroConsentimentos('')
    setOkConsentimentos('')
    if (!consentimentos.aceite_privacidade) {
      setErroConsentimentos(
        'É necessário aceitar a Política de Privacidade e os Termos de Uso.',
      )
      return
    }

    setSalvandoConsentimentos(true)
    try {
      const resp = await api.put('/api/perfil/consentimentos', consentimentos)
      setPerfil(resp.data)
      preencherConsentimentos(resp.data)
      setOkConsentimentos('Consentimentos atualizados.')
    } catch (err) {
      setErroConsentimentos(
        mensagemErro(err, 'Não foi possível salvar os consentimentos.'),
      )
    } finally {
      setSalvandoConsentimentos(false)
    }
  }

  function encerrar() {
    sair()
    navigate('/', { replace: true })
  }

  const inicial = (perfil?.nome_cliente ?? '?').trim().charAt(0).toUpperCase()

  return (
    <Page>
      <Title>Perfil</Title>
      {!perfil && !erro && <Feedback>Carregando…</Feedback>}
      {erro && !perfil && <ErrorText>{erro}</ErrorText>}
      {perfil && (
        <>
          <PhotoCard>
            {perfil.foto_perfil_url ? (
              <PhotoPreview src={perfil.foto_perfil_url} alt="Foto de perfil" />
            ) : (
              <PhotoPlaceholder aria-hidden="true">{inicial}</PhotoPlaceholder>
            )}
            <PhotoInfo>
              <PhotoTitle>Foto de perfil</PhotoTitle>
              <Hint>
                JPG, PNG ou WebP até {LIMITE_FOTO_MB} MB. Você ajusta o enquadramento antes de
                salvar. A foto aparece no ícone do menu.
              </Hint>
              <PhotoActions>
                <input
                  ref={arquivoRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={selecionarFoto}
                  hidden
                />
                <PhotoButton
                  type="button"
                  onClick={() => arquivoRef.current?.click()}
                  disabled={enviandoFoto}
                >
                  {enviandoFoto
                    ? 'Enviando…'
                    : perfil.foto_perfil_url
                      ? 'Trocar foto'
                      : 'Escolher foto'}
                </PhotoButton>
                {perfil.foto_perfil_url && (
                  <RemoveButton type="button" onClick={removerFoto} disabled={enviandoFoto}>
                    Remover
                  </RemoveButton>
                )}
              </PhotoActions>
              {erroFoto && <ErrorText>{erroFoto}</ErrorText>}
              {okFoto && <OkText>{okFoto}</OkText>}
            </PhotoInfo>
          </PhotoCard>

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

          <Card>
            <ConsentTitle>Privacidade e autorizações</ConsentTitle>
            <ConsentIntro>
              Você controla como seus dados e sua imagem são usados. Leia a{' '}
              <PolicyLink>Política de Privacidade e os Termos de Uso</PolicyLink>
              . As autorizações opcionais podem ser revogadas a qualquer momento.
            </ConsentIntro>

            <ConsentForm onSubmit={salvarConsentimentos}>
              <div>
                <ConsentRow>
                  <input
                    id="aceite-privacidade"
                    type="checkbox"
                    required
                    checked={consentimentos.aceite_privacidade}
                    onChange={(e) => atualizarConsentimento('aceite_privacidade', e.target.checked)}
                  />
                  <ConsentText>
                    <label htmlFor="aceite-privacidade">
                      Li e aceito a Política de Privacidade e os Termos de Uso.
                    </label>
                  </ConsentText>
                </ConsentRow>
                <ConsentStatus>{statusAceite(perfil)}</ConsentStatus>
              </div>

              <div>
                <ConsentRow>
                  <input
                    id="consentimento-imagem"
                    type="checkbox"
                    checked={consentimentos.consentimento_imagem}
                    onChange={(e) => atualizarConsentimento('consentimento_imagem', e.target.checked)}
                  />
                  <ConsentText>
                    <label htmlFor="consentimento-imagem">
                      Autorizo o uso da minha imagem em fotos e publicações do site e das redes
                      sociais da IMF Turismo.
                    </label>
                  </ConsentText>
                </ConsentRow>
                {statusConsentimento(perfil, 'consentimento_imagem') && (
                  <ConsentStatus>
                    {statusConsentimento(perfil, 'consentimento_imagem')}
                  </ConsentStatus>
                )}
              </div>

              <div>
                <ConsentRow>
                  <input
                    id="consentimento-marketing"
                    type="checkbox"
                    checked={consentimentos.consentimento_marketing}
                    onChange={(e) => atualizarConsentimento('consentimento_marketing', e.target.checked)}
                  />
                  <ConsentText>
                    <label htmlFor="consentimento-marketing">
                      Autorizo o recebimento de novidades e promoções por e-mail e WhatsApp.
                    </label>
                  </ConsentText>
                </ConsentRow>
                {statusConsentimento(perfil, 'consentimento_marketing') && (
                  <ConsentStatus>
                    {statusConsentimento(perfil, 'consentimento_marketing')}
                  </ConsentStatus>
                )}
              </div>

              <div>
                <ConsentRow>
                  <input
                    id="consentimento-compartilhamento"
                    type="checkbox"
                    checked={consentimentos.consentimento_compartilhamento}
                    onChange={(e) =>
                      atualizarConsentimento('consentimento_compartilhamento', e.target.checked)
                    }
                  />
                  <ConsentText>
                    <label htmlFor="consentimento-compartilhamento">
                      Autorizo o compartilhamento dos meus dados com fornecedores e parceiros
                      necessários para a realização das viagens.
                    </label>
                  </ConsentText>
                </ConsentRow>
                {statusConsentimento(perfil, 'consentimento_compartilhamento') && (
                  <ConsentStatus>
                    {statusConsentimento(perfil, 'consentimento_compartilhamento')}
                  </ConsentStatus>
                )}
              </div>

              <ConsentNote>
                O aceite da política é necessário para usar a plataforma. As demais autorizações
                são opcionais e não impedem o uso do site. Versão 1.0 — atualizada em 24/10/2026.
              </ConsentNote>

              {erroConsentimentos && <ErrorText>{erroConsentimentos}</ErrorText>}
              {okConsentimentos && <OkText>{okConsentimentos}</OkText>}
              <SaveButton type="submit" disabled={salvandoConsentimentos}>
                {salvandoConsentimentos ? 'Salvando…' : 'Salvar consentimentos'}
              </SaveButton>
            </ConsentForm>
          </Card>
        </>
      )}
      <OutButton type="button" onClick={encerrar}>
        Sair
      </OutButton>

      {arquivoEdicao && (
        <EditorFoto
          arquivo={arquivoEdicao}
          enviando={enviandoFoto}
          erroEnvio={erroFoto}
          onCancelar={() => {
            if (enviandoFoto) return
            setArquivoEdicao(null)
            setErroFoto('')
          }}
          onConfirmar={salvarFotoEditada}
        />
      )}
    </Page>
  )
}

export default Perfil

// ===========================================================================
// IMF TURISMO — Gerenciamento de Excursões (seção 3.9 + Página 5)
// Listagem em tabela com Editar/Excluir + formulário "Cadastrar Nova Excursão".
// O protótipo traz 1 campo Data; o RF01 exige ida + volta, descrição do
// roteiro e itens inclusos — todos incluídos aqui. A imagem pode ser enviada
// do computador (Supabase Storage via API) ou colada como URL/link do Drive.
// ===========================================================================

import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { api, mensagemErro } from '../lib/api.js'
import { colors } from '../theme.js'

const Title = styled.h1`
  color: ${colors.navy};
  font-weight: 800;
  font-size: 1.9rem;
  margin-bottom: 1.25rem;
`

const Card = styled.section`
  background-color: ${colors.background};
  border-radius: 0.25rem;
  padding: 1.5rem;
  box-shadow: 0 8px 24px rgb(15 45 82 / 0.08);
  margin-bottom: 1.5rem;
`

const PillInput = styled.input`
  width: 100%;
  border: 0;
  border-radius: 999px;
  background-color: ${colors.inputBg};
  padding: 0.6rem 1rem;
  color: ${colors.navy};
  margin-bottom: 0.7rem;
`

const PillSelect = styled.select`
  width: 100%;
  border: 0;
  border-radius: 999px;
  background-color: ${colors.inputBg};
  padding: 0.6rem 1rem;
  color: ${colors.navy};
  margin-bottom: 0.7rem;
`

const TextArea = styled.textarea`
  width: 100%;
  border: 0;
  border-radius: 1rem;
  background-color: ${colors.inputBg};
  padding: 0.6rem 1rem;
  color: ${colors.navy};
  margin-bottom: 0.7rem;
  resize: vertical;
`

const Label = styled.label`
  display: block;
  color: ${colors.navy};
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
`

const Row3 = styled.div`
  display: flex;
  gap: 0.7rem;

  @media (width <= 640px) {
    flex-direction: column;
  }
`

const SaveButton = styled.button`
  width: 100%;
  border: 0;
  border-radius: 999px;
  padding: 0.75rem;
  font-weight: 700;
  color: #fff;
  background-image: linear-gradient(90deg, ${colors.successDark}, ${colors.success});
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
`

const Th = styled.th`
  text-align: left;
  background-color: #f3f4f6;
  padding: 0.6rem;
  color: ${colors.navy};
`

const Td = styled.td`
  padding: 0.6rem;
  border-top: 1px solid #f3f4f6;
  color: ${colors.navy};
`

const DangerButton = styled.button`
  border: 0;
  border-radius: 999px;
  background-color: ${colors.danger};
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.35rem 0.8rem;
  margin-left: 0.4rem;
`

const EditButton = styled.button`
  border: 0;
  border-radius: 999px;
  background-color: ${colors.primary};
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.35rem 0.8rem;
`

const Feedback = styled.p`
  color: ${colors.textMuted};
  font-size: 0.9rem;
`

const ErrorText = styled.p`
  color: ${colors.danger};
  font-size: 0.85rem;
  margin-bottom: 0.7rem;
`

const UploadRow = styled.div`
  display: flex;
  gap: 0.6rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0.7rem;
`

const UploadButton = styled.button`
  border: 0;
  border-radius: 999px;
  background-color: ${colors.primary};
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 0.55rem 1.1rem;

  &:disabled {
    opacity: 0.6;
  }
`

const Preview = styled.img`
  display: block;
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  border-radius: 1rem;
  margin-bottom: 0.7rem;
  background-color: ${colors.inputBg};
`

const Hint = styled.p`
  color: ${colors.textMuted};
  font-size: 0.78rem;
  margin-bottom: 0.7rem;
`

const FORM_VAZIO = {
  nome_excursao: '',
  destino: '',
  destino_novo: '',
  data_ida: '',
  data_volta: '',
  valor_pessoa: '',
  vagas_totais: '',
  descricao_roteiro: '',
  itens_inclusos: '',
  prazo_cancelamento_dias: 30,
  imagem_url: '',
}

const DESTINOS_SUGERIDOS = ['Caldas Novas', 'Maceió', 'Porto de Galinhas', 'Jericoacoara', 'Outro']

// O Vercel corta requisições em ~4,5 MB; 4 MB deixa margem para o multipart.
// A checagem no front evita o erro genérico de "payload too large".
const LIMITE_IMAGEM_BYTES = 4 * 1024 * 1024
const TIPOS_IMAGEM = ['image/jpeg', 'image/png', 'image/webp']

// Extrai o ID de um link do Google Drive (formatos /file/d/ID/view e ?id=ID).
function idDoDrive(valor) {
  const texto = String(valor ?? '')
  const match = texto.match(/\/d\/([\w-]{10,})/) || texto.match(/[?&]id=([\w-]{10,})/)
  return match?.[1] ?? null
}

// Converte o link de compartilhamento do Drive na URL direta da imagem.
// O arquivo precisa estar público ("Qualquer pessoa com o link").
function normalizarLinkImagem(valor) {
  const id = idDoDrive(valor)
  if (id && valor.includes('drive.google.com')) {
    return `https://lh3.googleusercontent.com/d/${id}`
  }
  return valor
}

function AdminExcursoes() {
  const [lista, setLista] = useState([])
  const [form, setForm] = useState(FORM_VAZIO)
  const [editando, setEditando] = useState(null)
  const [erro, setErro] = useState('')
  const [enviandoImagem, setEnviandoImagem] = useState(false)
  const [erroImagem, setErroImagem] = useState('')
  const arquivoRef = useRef(null)

  async function carregar() {
    try {
      const resp = await api.get('/api/admin/excursoes')
      setLista(resp.data)
    } catch {
      setErro('Não foi possível carregar as excursões.')
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  function atualizar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  async function enviarImagem(event) {
    const arquivo = event.target.files?.[0]
    if (!arquivo) return
    setErroImagem('')

    if (!TIPOS_IMAGEM.includes(arquivo.type)) {
      setErroImagem('Envie uma imagem JPG, PNG ou WebP.')
      event.target.value = ''
      return
    }

    if (arquivo.size > LIMITE_IMAGEM_BYTES) {
      const tamanho = (arquivo.size / 1024 / 1024).toFixed(1)
      setErroImagem(`A imagem tem ${tamanho} MB. O limite é 4 MB.`)
      event.target.value = ''
      return
    }

    setEnviandoImagem(true)
    try {
      const dados = new FormData()
      dados.append('arquivo', arquivo)
      // Sem Content-Type manual: o axios define o boundary do multipart.
      const resp = await api.post('/api/admin/excursoes/imagem', dados)
      atualizar('imagem_url', resp.data.imagem_url)
    } catch (err) {
      setErroImagem(mensagemErro(err, 'Não foi possível enviar a imagem.'))
    } finally {
      setEnviandoImagem(false)
      // Permite escolher o mesmo arquivo novamente depois de um erro.
      event.target.value = ''
    }
  }

  async function salvar(event) {
    event.preventDefault()
    setErro('')
    // "Outro" abre o campo livre de destino.
    const destinoFinal = form.destino === 'Outro' ? form.destino_novo.trim() : form.destino.trim()
    if (!destinoFinal) {
      setErro('Informe o destino da excursão.')
      return
    }
    const payload = {
      nome_excursao: form.nome_excursao.trim(),
      destino: destinoFinal,
      data_ida: form.data_ida,
      data_volta: form.data_volta,
      valor_pessoa: Number(form.valor_pessoa),
      vagas_totais: Number(form.vagas_totais),
      descricao_roteiro: form.descricao_roteiro.trim(),
      itens_inclusos: form.itens_inclusos.trim(),
      prazo_cancelamento_dias: Number(form.prazo_cancelamento_dias),
      imagem_url: normalizarLinkImagem(form.imagem_url.trim()) || null,
    }
    try {
      if (editando) {
        await api.put(`/api/admin/excursoes/${editando}`, payload)
      } else {
        await api.post('/api/admin/excursoes', payload)
      }
      setForm(FORM_VAZIO)
      setEditando(null)
      await carregar()
    } catch (err) {
      setErro(err?.response?.data?.detail ?? 'Não foi possível salvar. Revise os campos.')
    }
  }

  function comecarEdicao(excursao) {
    setEditando(excursao.id_excursao)
    setForm({
      nome_excursao: excursao.nome_excursao ?? '',
      destino: DESTINOS_SUGERIDOS.includes(excursao.destino) ? excursao.destino : 'Outro',
      destino_novo: DESTINOS_SUGERIDOS.includes(excursao.destino) ? '' : (excursao.destino ?? ''),
      data_ida: String(excursao.data_ida ?? '').slice(0, 10),
      data_volta: String(excursao.data_volta ?? '').slice(0, 10),
      valor_pessoa: excursao.valor_pessoa ?? '',
      vagas_totais: excursao.vagas_totais ?? '',
      descricao_roteiro: excursao.descricao_roteiro ?? '',
      itens_inclusos: excursao.itens_inclusos ?? '',
      prazo_cancelamento_dias: excursao.prazo_cancelamento_dias ?? 30,
      imagem_url: excursao.imagem_url ?? '',
    })
    window.scrollTo({ top: 0 })
  }

  async function excluir(idExcursao) {
    // Ação destrutiva exige confirmação em modal (seção 2.1).
    if (!window.confirm('Excluir esta excursão?')) return
    if (!window.confirm('Confirmar exclusão definitiva?')) return
    try {
      await api.delete(`/api/admin/excursoes/${idExcursao}`)
      await carregar()
    } catch (err) {
      window.alert(err?.response?.data?.detail ?? 'Não foi possível excluir.')
    }
  }

  return (
    <>
      <Title>{editando ? 'Editar Excursão' : 'Cadastrar Nova Excursão'}</Title>
      <Card>
        <form onSubmit={salvar}>
          <Label>Nome da excursão:</Label>
          <PillInput placeholder="Nome da Excursão" required minLength={3} value={form.nome_excursao} onChange={(e) => atualizar('nome_excursao', e.target.value)} />
          <Label>Destino:</Label>
          <PillSelect value={form.destino} onChange={(e) => atualizar('destino', e.target.value)} required>
            <option value="">Selecione o Destino</option>
            {DESTINOS_SUGERIDOS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </PillSelect>
          {form.destino === 'Outro' && (
            <PillInput placeholder="Digite o destino" required value={form.destino_novo} onChange={(e) => atualizar('destino_novo', e.target.value)} />
          )}
          <Row3>
            <div style={{ flex: 1 }}>
              <Label>Preço:</Label>
              <PillInput type="number" min={1} step="0.01" placeholder="R$" required value={form.valor_pessoa} onChange={(e) => atualizar('valor_pessoa', e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <Label>Data de ida:</Label>
              <PillInput type="date" required value={form.data_ida} onChange={(e) => atualizar('data_ida', e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <Label>Data de volta:</Label>
              <PillInput type="date" required value={form.data_volta} onChange={(e) => atualizar('data_volta', e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <Label>Número de Vagas:</Label>
              <PillInput type="number" min={1} placeholder="Vagas" required value={form.vagas_totais} onChange={(e) => atualizar('vagas_totais', e.target.value)} />
            </div>
          </Row3>
          <Label>Descrição do roteiro (RF01):</Label>
          <TextArea rows={3} required minLength={10} value={form.descricao_roteiro} onChange={(e) => atualizar('descricao_roteiro', e.target.value)} />
          <Label>Itens inclusos (RF01):</Label>
          <TextArea rows={2} value={form.itens_inclusos} onChange={(e) => atualizar('itens_inclusos', e.target.value)} />
          <Label>Prazo de cancelamento (dias):</Label>
          <PillInput type="number" min={0} value={form.prazo_cancelamento_dias} onChange={(e) => atualizar('prazo_cancelamento_dias', e.target.value)} />
          <Label>Imagem da excursão:</Label>
          {form.imagem_url && (
            <Preview
              key={form.imagem_url}
              src={form.imagem_url}
              alt="Prévia da imagem da excursão"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
          <UploadRow>
            <input
              ref={arquivoRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={enviarImagem}
              hidden
            />
            <UploadButton
              type="button"
              onClick={() => arquivoRef.current?.click()}
              disabled={enviandoImagem}
            >
              {enviandoImagem ? 'Enviando…' : 'Escolher imagem do computador'}
            </UploadButton>
            {form.imagem_url && (
              <EditButton type="button" onClick={() => atualizar('imagem_url', '')}>
                Remover imagem
              </EditButton>
            )}
          </UploadRow>
          <Hint>
            JPG, PNG ou WebP, até 4 MB. Também aceita colar uma URL ou um link do Google
            Drive — nesse caso, compartilhe o arquivo como “Qualquer pessoa com o link”.
          </Hint>
          <PillInput
            type="url"
            placeholder="https://…/imagem.jpg ou link do Drive"
            value={form.imagem_url}
            onChange={(e) => atualizar('imagem_url', e.target.value)}
            onBlur={(e) => atualizar('imagem_url', normalizarLinkImagem(e.target.value))}
          />
          {erroImagem && <ErrorText>{erroImagem}</ErrorText>}
          {erro && <Feedback>{erro}</Feedback>}
          <SaveButton type="submit">{editando ? 'Atualizar' : 'Salvar'}</SaveButton>
        </form>
      </Card>

      <Title>Excursões cadastradas</Title>
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Nome</Th>
              <Th>Destino</Th>
              <Th>Vagas</Th>
              <Th>Valor</Th>
              <Th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {lista.map((e) => (
              <tr key={e.id_excursao}>
                <Td>{e.nome_excursao}</Td>
                <Td>{e.destino}</Td>
                <Td>{e.vagas_disponiveis}/{e.vagas_totais}</Td>
                <Td>R$ {e.valor_pessoa}</Td>
                <Td>
                  <EditButton type="button" onClick={() => comecarEdicao(e)}>Editar</EditButton>
                  <DangerButton type="button" onClick={() => excluir(e.id_excursao)}>Excluir</DangerButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {lista.length === 0 && <Feedback>Nenhuma excursão cadastrada.</Feedback>}
      </Card>
    </>
  )
}

export default AdminExcursoes

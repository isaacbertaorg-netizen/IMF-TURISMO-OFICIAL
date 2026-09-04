// ===========================================================================
// IMF TURISMO — Minhas Reservas (seção 3.5 do PRODUCT.md)
// Lista com status; Cancelar aparece só dentro do prazo da excursão
// (o back valida de novo — RF06). Botão Editar abre a troca de passageiros
// (PUT /api/reservas/:id/passageiros), sem alterar vagas.
// ===========================================================================

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { api, formatarDataHoraLocal, mensagemErro } from '../lib/api.js'
import { formatarCPF } from '../lib/mascaras.js'
import { colors } from '../theme.js'

const Page = styled.main`
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
`

const Title = styled.h1`
  color: ${colors.navy};
  font-weight: 800;
  font-size: 2rem;
  margin-bottom: 1.25rem;
`

const Card = styled.article`
  background-color: ${colors.background};
  border-radius: 1rem;
  box-shadow: 0 8px 24px rgb(15 45 82 / 0.08);
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.9rem;
`

const TopRow = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`

const Info = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`

const Destino = styled.strong`
  color: ${colors.navy};
`

const Meta = styled.span`
  color: ${colors.textMuted};
  font-size: 0.85rem;
`

const Status = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 999px;
  padding: 0.2rem 0.7rem;
  background-color: ${(props) =>
    props.$status === 'cancelada' ? '#FEE2E2' : props.$status === 'confirmada' ? '#D1FAE5' : '#FEF3C7'};
  color: ${(props) =>
    props.$status === 'cancelada' ? colors.danger : props.$status === 'confirmada' ? colors.successDark : '#92400E'};
`

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`

const CancelButton = styled.button`
  border: 0;
  border-radius: 999px;
  background-color: ${colors.danger};
  color: #fff;
  font-weight: 700;
  font-size: 0.8rem;
  padding: 0.45rem 1rem;
`

const EditButton = styled.button`
  border: 0;
  border-radius: 999px;
  background-color: ${colors.primary};
  color: #fff;
  font-weight: 700;
  font-size: 0.8rem;
  padding: 0.45rem 1rem;
`

const EditForm = styled.form`
  border-top: 1px solid #e5e7eb;
  padding-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const EditRow = styled.div`
  display: flex;
  gap: 0.5rem;

  @media (width <= 640px) {
    flex-direction: column;
  }
`

const PillInput = styled.input`
  flex: 1;
  border: 0;
  border-radius: 999px;
  background-color: ${colors.inputBg};
  padding: 0.55rem 1rem;
  color: ${colors.navy};
  min-width: 0;
`

const SaveButton = styled.button`
  border: 0;
  border-radius: 999px;
  background-color: ${colors.successDark};
  color: #fff;
  font-weight: 700;
  font-size: 0.8rem;
  padding: 0.45rem 1rem;
  align-self: flex-start;
`

const Feedback = styled.p`
  color: ${colors.textMuted};
  text-align: center;
  padding: 2rem 0;
`

const ErrorText = styled.p`
  color: ${colors.danger};
  font-size: 0.85rem;
`

// Cancelamento só dentro do prazo: (data_ida - hoje) >= prazo (RF06).
// Datas sem hora são tratadas no fuso local para não cair um dia.
function dentroDoPrazo(dataIda, prazoDias) {
  if (!dataIda) return true
  const [ano, mes, dia] = String(dataIda).slice(0, 10).split('-').map(Number)
  const ida = new Date(ano, mes - 1, dia)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const diffDias = Math.round((ida - hoje) / 86400000)
  return diffDias >= (prazoDias ?? 0)
}

function MinhasReservas() {
  const [reservas, setReservas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [editando, setEditando] = useState(null)
  const [passageiros, setPassageiros] = useState([])
  const [erroEdicao, setErroEdicao] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      const resp = await api.get('/api/reservas/minhas')
      setReservas(resp.data)
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível carregar suas reservas.'))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  async function cancelar(idReserva) {
    if (!window.confirm('Cancelar esta reserva?')) return
    try {
      await api.patch(`/api/reservas/${idReserva}/cancelar`)
      await carregar()
    } catch (err) {
      window.alert(mensagemErro(err, 'Não foi possível cancelar.'))
    }
  }

  function comecarEdicao(reserva) {
    setEditando(reserva.id_reserva)
    setErroEdicao('')
    // Pré-preenche com os passageiros atuais (vêm no /minhas).
    setPassageiros(
      (reserva.passageiros ?? []).map((p) => ({
        nome_passageiro: p.nome_passageiro ?? '',
        cpf: formatarCPF(p.cpf ?? ''),
        data_nascimento: String(p.data_nascimento ?? '').slice(0, 10),
      })),
    )
  }

  function atualizarPassageiro(indice, campo, valor) {
    setPassageiros((atual) => atual.map((p, i) => (i === indice ? { ...p, [campo]: valor } : p)))
  }

  async function salvarEdicao(event, reserva) {
    event.preventDefault()
    setErroEdicao('')
    setSalvando(true)
    try {
      await api.put(`/api/reservas/${reserva.id_reserva}/passageiros`, {
        passageiros: passageiros.map((p) => ({
          nome_passageiro: p.nome_passageiro.trim(),
          cpf: p.cpf.replace(/\D/g, ''),
          data_nascimento: p.data_nascimento,
        })),
      })
      setEditando(null)
      await carregar()
    } catch (err) {
      setErroEdicao(mensagemErro(err, 'Não foi possível salvar as alterações.'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Page>
      <Title>Minhas Reservas</Title>
      {carregando && <Feedback>Carregando…</Feedback>}
      {!carregando && erro && <Feedback>{erro}</Feedback>}
      {!carregando && !erro && reservas.length === 0 && (
        <Feedback>
          Você ainda não tem reservas. <Link to="/">Confira nossos pacotes!</Link>
        </Feedback>
      )}
      {!carregando &&
        reservas.map((r) => {
          const cancelavel = r.status !== 'cancelada' && dentroDoPrazo(r.data_ida, r.prazo_cancelamento_dias)
          const editavel = r.status !== 'cancelada'
          return (
            <Card key={r.id_reserva}>
              <TopRow>
                <Info>
                  <Destino>{r.excursao_destino ?? r.excursao_nome ?? `Excursão ${r.id_excursao}`}</Destino>
                  <Meta>
                    {r.qtd_vagas} vaga{r.qtd_vagas > 1 ? 's' : ''} · reservada em {formatarDataHoraLocal(r.data_reserva)}
                  </Meta>
                  {r.status !== 'cancelada' && !dentroDoPrazo(r.data_ida, r.prazo_cancelamento_dias) && (
                    <Meta>Fora do prazo de cancelamento.</Meta>
                  )}
                </Info>
                <Status $status={r.status}>{r.status}</Status>
                <Actions>
                  {editavel && (
                    <EditButton type="button" onClick={() => (editando === r.id_reserva ? setEditando(null) : comecarEdicao(r))}>
                      {editando === r.id_reserva ? 'Fechar' : 'Editar'}
                    </EditButton>
                  )}
                  {cancelavel && (
                    <CancelButton type="button" onClick={() => cancelar(r.id_reserva)}>
                      Cancelar
                    </CancelButton>
                  )}
                </Actions>
              </TopRow>
              {editando === r.id_reserva && (
                <EditForm onSubmit={(e) => salvarEdicao(e, r)}>
                  {passageiros.map((p, i) => (
                    <EditRow key={i}>
                      <PillInput
                        placeholder="Nome do passageiro"
                        required
                        value={p.nome_passageiro}
                        onChange={(e) => atualizarPassageiro(i, 'nome_passageiro', e.target.value)}
                      />
                      <PillInput
                        placeholder="000.000.000-00"
                        required
                        inputMode="numeric"
                        maxLength={14}
                        value={p.cpf}
                        onChange={(e) => atualizarPassageiro(i, 'cpf', formatarCPF(e.target.value))}
                      />
                      <PillInput
                        type="date"
                        required
                        aria-label={`Nascimento passageiro ${i + 1}`}
                        value={p.data_nascimento}
                        onChange={(e) => atualizarPassageiro(i, 'data_nascimento', e.target.value)}
                      />
                    </EditRow>
                  ))}
                  {erroEdicao && <ErrorText>{erroEdicao}</ErrorText>}
                  <SaveButton type="submit" disabled={salvando}>
                    {salvando ? 'Salvando…' : 'Salvar alterações'}
                  </SaveButton>
                </EditForm>
              )}
            </Card>
          )
        })}
    </Page>
  )
}

export default MinhasReservas

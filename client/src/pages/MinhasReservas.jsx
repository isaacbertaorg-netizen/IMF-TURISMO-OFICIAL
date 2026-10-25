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
import { idadeNaData } from '../lib/datas.js'
import { formatarCPF, cpfValido } from '../lib/mascaras.js'
import { linkWhatsApp, mensagemCancelamento, mensagemPagamento } from '../lib/whatsapp.js'
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
  flex-wrap: wrap;
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
  flex-wrap: wrap;
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

const ConsentBox = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  background-color: ${colors.backgroundAlt};
  border-radius: 0.75rem;
  padding: 0.7rem 0.9rem;
  color: ${colors.navy};
  font-size: 0.82rem;
  line-height: 1.45;

  input {
    width: 1.05rem;
    height: 1.05rem;
    margin-top: 0.15rem;
    accent-color: ${colors.primary};
    flex-shrink: 0;
  }

  a {
    color: ${colors.primary};
    font-weight: 600;
    text-decoration: underline;
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

// Link do pagamento (WhatsApp) no mesmo formato dos demais botões de ação.
const PayLink = styled.a`
  border-radius: 999px;
  background-color: #128c7e;
  color: #fff;
  font-weight: 700;
  font-size: 0.8rem;
  padding: 0.45rem 1rem;
  text-decoration: none;
`

// Pedido de cancelamento fora do prazo: abre o WhatsApp em vez de cancelar
// direto, porque o reembolso/crédito é analisado pela empresa.
const RequestCancelLink = styled.a`
  border: 1px solid ${colors.danger};
  border-radius: 999px;
  background-color: transparent;
  color: ${colors.danger};
  font-weight: 700;
  font-size: 0.8rem;
  padding: 0.45rem 1rem;
  text-decoration: none;
  white-space: nowrap;
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

// "pendente" é o status técnico; para o cliente, significa pagamento em aberto.
const ROTULOS_STATUS = {
  pendente: 'Aguardando pagamento',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
}

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
  const [declaracaoResponsavelMenor, setDeclaracaoResponsavelMenor] = useState(false)
  const [erroEdicao, setErroEdicao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [whatsappNumero, setWhatsappNumero] = useState('')

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      // O número vem da configuração pública; se falhar, o link usa o padrão.
      const [resp, respConfig] = await Promise.all([
        api.get('/api/reservas/minhas'),
        api.get('/api/config').catch(() => null),
      ])
      setReservas(resp.data)
      if (respConfig?.data?.whatsapp_numero) {
        setWhatsappNumero(respConfig.data.whatsapp_numero)
      }
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
    setDeclaracaoResponsavelMenor(Boolean(reserva.declaracao_responsavel_menor))
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
    // Mesma checagem do back-end, mas apontando o passageiro com problema.
    const indiceInvalido = passageiros.findIndex((p) => !cpfValido(p.cpf))
    if (indiceInvalido >= 0) {
      setErroEdicao(`CPF inválido no passageiro ${indiceInvalido + 1}. Confira os números.`)
      return
    }

    const temMenor = passageiros.some((p) => {
      const idade = idadeNaData(p.data_nascimento, reserva.data_ida)
      return idade !== null && idade >= 0 && idade < 18
    })
    if (temMenor && !declaracaoResponsavelMenor) {
      setErroEdicao(
        'É necessário que o responsável legal autorize a reserva para passageiro menor de 18 anos.',
      )
      return
    }

    setSalvando(true)
    try {
      await api.put(`/api/reservas/${reserva.id_reserva}/passageiros`, {
        passageiros: passageiros.map((p) => ({
          nome_passageiro: p.nome_passageiro.trim(),
          cpf: p.cpf.replace(/\D/g, ''),
          data_nascimento: p.data_nascimento,
        })),
        declaracao_responsavel_menor: temMenor ? declaracaoResponsavelMenor : false,
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
          const temMenorEdicao =
            editando === r.id_reserva &&
            passageiros.some((p) => {
              const idade = idadeNaData(p.data_nascimento, r.data_ida)
              return idade !== null && idade >= 0 && idade < 18
            })
          return (
            <Card key={r.id_reserva}>
              <TopRow>
                <Info>
                  <Destino>{r.excursao_destino ?? r.excursao_nome ?? `Excursão ${r.id_excursao}`}</Destino>
                  <Meta>
                    {r.qtd_vagas} vaga{r.qtd_vagas > 1 ? 's' : ''} · reservada em {formatarDataHoraLocal(r.data_reserva)}
                  </Meta>
                  {r.status !== 'cancelada' && !dentroDoPrazo(r.data_ida, r.prazo_cancelamento_dias) && (
                    <Meta>Fora do prazo de cancelamento automático.</Meta>
                  )}
                </Info>
                <Status $status={r.status}>{ROTULOS_STATUS[r.status] ?? r.status}</Status>
                <Actions>
                  {r.status === 'pendente' && (
                    <PayLink
                      href={linkWhatsApp(
                        whatsappNumero,
                        mensagemPagamento({
                          id_reserva: r.id_reserva,
                          destino: r.excursao_destino ?? r.excursao_nome,
                          data_ida: r.data_ida,
                          data_volta: r.data_volta,
                          qtd_vagas: r.qtd_vagas,
                          valor_pessoa: r.valor_pessoa,
                        }),
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Pagar
                    </PayLink>
                  )}
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
                  {r.status !== 'cancelada' &&
                    !dentroDoPrazo(r.data_ida, r.prazo_cancelamento_dias) && (
                      <RequestCancelLink
                        href={linkWhatsApp(
                          whatsappNumero,
                          mensagemCancelamento({
                            id_reserva: r.id_reserva,
                            destino: r.excursao_destino ?? r.excursao_nome,
                            data_ida: r.data_ida,
                            data_volta: r.data_volta,
                            qtd_vagas: r.qtd_vagas,
                          }),
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Solicitar cancelamento
                      </RequestCancelLink>
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
                  {temMenorEdicao && (
                    <ConsentBox>
                      <input
                        type="checkbox"
                        checked={declaracaoResponsavelMenor}
                        onChange={(e) => setDeclaracaoResponsavelMenor(e.target.checked)}
                      />
                      <span>
                        Declaro ser responsável legal pelo(s) passageiro(s) menor(es) de 18 anos e
                        autorizo o tratamento dos dados para esta reserva, nos termos da{' '}
                        <Link to="/politica-de-privacidade" target="_blank" rel="noreferrer">
                          Política de Privacidade
                        </Link>
                        .
                      </span>
                    </ConsentBox>
                  )}
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

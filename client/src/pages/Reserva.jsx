// ===========================================================================
// IMF TURISMO — Fluxo de Reserva (seção 3.4 + Página 4 do protótipo)
// Etapa 1: quantidade de vagas. Etapa 2: um formulário por passageiro
// (nome, CPF, data de nascimento — RF04). Etapa 3: pagamento combinado
// diretamente com a empresa pelo WhatsApp (link wa.me com a mensagem pronta).
// POST /api/reservas cria com status 'pendente'; a confirmação é manual no
// painel admin, depois que a empresa recebe o pagamento.
// ===========================================================================

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { api, formatarDataBR, formatarMoeda, mensagemErro } from '../lib/api.js'
import { formatarCPF, cpfValido } from '../lib/mascaras.js'
import { linkWhatsApp, mensagemPagamento } from '../lib/whatsapp.js'
import { colors } from '../theme.js'
import cardCaldas from '../assets/card-caldas-novas.jpg'
import cardMaceio from '../assets/card-maceio.webp'

const Page = styled.main`
  max-width: 760px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
`

const Title = styled.h1`
  color: ${colors.navy};
  font-weight: 800;
  font-size: 2.2rem;
  margin-bottom: 1.25rem;
`

const Card = styled.section`
  background-color: ${colors.background};
  border-radius: 1.25rem;
  box-shadow: 0 8px 24px rgb(15 45 82 / 0.08);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const TopRow = styled.div`
  display: flex;
  gap: 1.25rem;

  @media (width <= 640px) {
    flex-direction: column;
  }
`

const Photo = styled.img`
  width: 180px;
  height: 180px;
  object-fit: cover;
  border-radius: 1rem;

  @media (width <= 640px) {
    width: 100%;
  }
`

const Info = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`

const Destino = styled.h2`
  color: ${colors.navy};
  font-size: 1.5rem;
  font-weight: 800;
`

const Periodo = styled.p`
  color: ${colors.textMuted};
`

const Valor = styled.p`
  color: ${colors.navy};
  font-size: 1.4rem;
  font-weight: 700;
  margin-left: auto;
`

const PillInput = styled.input`
  border: 0;
  border-radius: 999px;
  background-color: ${colors.inputBg};
  padding: 0.6rem 1rem;
  color: ${colors.navy};
  width: 100%;
`

const Row = styled.div`
  display: flex;
  gap: 0.6rem;
  align-items: end;

  @media (width <= 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`

const PassageiroBloco = styled.fieldset`
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const PassageiroTitulo = styled.legend`
  color: ${colors.navy};
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0 0.4rem;
`

const Campo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
`

const Rotulo = styled.label`
  color: ${colors.navy};
  font-size: 0.8rem;
  font-weight: 600;
`

const Counter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.1rem;
  color: ${colors.navy};
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
`

const CounterButton = styled.button`
  border: 0;
  background: transparent;
  font-size: 1.3rem;
  color: ${colors.navy};
  padding: 0 0.5rem;
`

const ConfirmButton = styled.button`
  border: 0;
  border-radius: 999px;
  margin-left: auto;
  padding: 0.7rem 1.6rem;
  font-weight: 700;
  color: #fff;
  background-image: linear-gradient(90deg, ${colors.successGradient[0]}, ${colors.successGradient[1]});
`

const Back = styled(Link)`
  display: block;
  text-align: center;
  color: ${colors.primary};
  font-size: 0.85rem;
  margin-top: 1rem;
`

const ErrorText = styled.p`
  color: ${colors.danger};
  font-size: 0.9rem;
`

const SuccessTitle = styled.h2`
  color: ${colors.navy};
  font-size: 1.5rem;
  font-weight: 800;
`

const Resumo = styled.ul`
  list-style: none;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: ${colors.navy};
  background-color: ${colors.backgroundAlt};
  border-radius: 1rem;
  padding: 1rem 1.25rem;
`

const WhatsAppButton = styled.a`
  display: block;
  text-align: center;
  text-decoration: none;
  border-radius: 999px;
  padding: 0.85rem 1.6rem;
  font-weight: 700;
  color: #fff;
  background-color: #128c7e;
`

const Note = styled.p`
  color: ${colors.textMuted};
  font-size: 0.85rem;
  text-align: center;
`

const StepLabel = styled.h3`
  color: ${colors.navy};
  font-size: 1rem;
  font-weight: 700;
`

function escolherFoto(excursao) {
  if (excursao?.imagem_url) return excursao.imagem_url
  return fotoLocal(excursao?.destino)
}

// Foto local por destino, usada quando não há imagem no banco ou a URL falha.
function fotoLocal(destino) {
  const texto = String(destino ?? '').toLowerCase()
  if (texto.includes('caldas')) return cardCaldas
  if (texto.includes('macei')) return cardMaceio
  return cardCaldas
}

function passageiroVazio() {
  return { nome_passageiro: '', cpf: '', data_nascimento: '' }
}

function Reserva() {
  const { id } = useParams()
  const [excursao, setExcursao] = useState(null)
  const [qtd, setQtd] = useState(2)
  const [passageiros, setPassageiros] = useState([passageiroVazio(), passageiroVazio()])
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  // Reserva recém-criada: quando existe, a tela vira a etapa de pagamento.
  const [reservaCriada, setReservaCriada] = useState(null)
  const [whatsappNumero, setWhatsappNumero] = useState('')

  useEffect(() => {
    async function carregar() {
      try {
        // A config é pública e independente: se falhar, o link usa o número
        // padrão de whatsapp.js e o pagamento continua funcionando.
        const [respExcursao, respConfig] = await Promise.all([
          api.get(`/api/excursoes/${id}`),
          api.get('/api/config').catch(() => null),
        ])
        setExcursao(respExcursao.data)
        if (respConfig?.data?.whatsapp_numero) {
          setWhatsappNumero(respConfig.data.whatsapp_numero)
        }
      } catch {
        setErro('Excursão não encontrada.')
      }
    }
    carregar()
  }, [id])

  function ajustarQtd(nova) {
    // Limita entre 1 e as vagas disponíveis da excursão.
    const max = excursao?.vagas_disponiveis ?? 30
    const valor = Math.min(Math.max(1, nova), max)
    setQtd(valor)
    setPassageiros((atual) => {
      if (valor > atual.length) return [...atual, ...Array.from({ length: valor - atual.length }, passageiroVazio)]
      return atual.slice(0, valor)
    })
  }

  function atualizarPassageiro(indice, campo, valor) {
    setPassageiros((atual) => atual.map((p, i) => (i === indice ? { ...p, [campo]: valor } : p)))
  }

  async function confirmar() {
    setErro('')
    // Barra o CPF inválido antes de chamar a API, indicando qual passageiro.
    const indiceInvalido = passageiros.findIndex((p) => !cpfValido(p.cpf))
    if (indiceInvalido >= 0) {
      setErro(`CPF inválido no passageiro ${indiceInvalido + 1}. Confira os números.`)
      return
    }
    setEnviando(true)
    try {
      const resp = await api.post('/api/reservas', {
        id_excursao: Number(id),
        qtd_vagas: qtd,
        passageiros: passageiros.map((p) => ({
          nome_passageiro: p.nome_passageiro.trim(),
          cpf: p.cpf.replace(/\D/g, ''),
          data_nascimento: p.data_nascimento,
        })),
      })
      // Não navega: mostra a etapa de pagamento com o link do WhatsApp.
      setReservaCriada(resp.data)
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível confirmar a reserva.'))
    } finally {
      setEnviando(false)
    }
  }

  if (!excursao) {
    return (
      <Page>
        <Title>Confirmar Reserva</Title>
        {erro ? <ErrorText>{erro}</ErrorText> : <p>Carregando…</p>}
        <Back to="/">Voltar à página inicial</Back>
      </Page>
    )
  }

  const periodo = `${formatarDataBR(excursao.data_ida)} a ${formatarDataBR(excursao.data_volta)}`

  // Etapa 3 — pagamento. A reserva já foi gravada como 'pendente'; o link
  // abre o WhatsApp da empresa com os dados prontos para combinar o valor.
  if (reservaCriada) {
    const total = Number(excursao.valor_pessoa) * Number(reservaCriada.qtd_vagas)
    const mensagem = mensagemPagamento({
      id_reserva: reservaCriada.id_reserva,
      destino: excursao.destino,
      data_ida: excursao.data_ida,
      data_volta: excursao.data_volta,
      qtd_vagas: reservaCriada.qtd_vagas,
      valor_pessoa: excursao.valor_pessoa,
    })

    return (
      <Page>
        <Title>Pagamento</Title>
        <Card>
          <SuccessTitle>Reserva #{reservaCriada.id_reserva} registrada!</SuccessTitle>
          <p>Suas vagas estão reservadas. Falta só combinar o pagamento.</p>

          <Resumo>
            <li>
              <strong>Pacote:</strong> {excursao.destino}
            </li>
            <li>
              <strong>Período:</strong> {periodo}
            </li>
            <li>
              <strong>Pessoas:</strong> {reservaCriada.qtd_vagas}
            </li>
            <li>
              <strong>Total:</strong> {formatarMoeda(total)}
            </li>
          </Resumo>

          <p>
            O pagamento é combinado diretamente com a IMF Turismo pelo WhatsApp. Clique no
            botão abaixo: a mensagem já vai preenchida com os dados da sua reserva.
          </p>

          <WhatsAppButton
            href={linkWhatsApp(whatsappNumero, mensagem)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Pagar pelo WhatsApp
          </WhatsAppButton>

          <Note>
            A reserva fica como “Aguardando pagamento” até a IMF Turismo confirmar o
            recebimento. Você pode acompanhar em Minhas Reservas.
          </Note>
          <Back to="/minhas-reservas">Ver minhas reservas</Back>
        </Card>
      </Page>
    )
  }

  return (
    <Page>
      <Title>Confirmar Reserva</Title>
      <Card>
        <TopRow>
          <Photo
            src={escolherFoto(excursao)}
            alt={excursao.destino}
            onError={(e) => {
              if (e.currentTarget.dataset.fb !== '1') {
                e.currentTarget.dataset.fb = '1'
                e.currentTarget.src = fotoLocal(excursao.destino)
              }
            }}
          />
          <Info>
            <Destino>{excursao.destino}</Destino>
            <Periodo>{periodo}</Periodo>
            <Valor>{formatarMoeda(excursao.valor_pessoa)}/pessoa</Valor>
          </Info>
        </TopRow>

        <StepLabel>Etapa 1 — Vagas</StepLabel>
        <Row>
          <PillInput
            type="number"
            min={1}
            max={excursao.vagas_disponiveis}
            value={qtd}
            onChange={(e) => ajustarQtd(Number(e.target.value))}
            aria-label="Quantidade de vagas"
          />
        </Row>

        <StepLabel>Etapa 2 — Passageiros (um por vaga)</StepLabel>
        {passageiros.map((p, i) => (
          <PassageiroBloco key={i}>
            <PassageiroTitulo>Passageiro {i + 1}</PassageiroTitulo>
            <Row>
              <Campo>
                <Rotulo>Nome completo</Rotulo>
                <PillInput placeholder="Nome do passageiro" required value={p.nome_passageiro} onChange={(e) => atualizarPassageiro(i, 'nome_passageiro', e.target.value)} />
              </Campo>
              <Campo>
                <Rotulo>CPF</Rotulo>
                <PillInput placeholder="000.000.000-00" required inputMode="numeric" maxLength={14} value={p.cpf} onChange={(e) => atualizarPassageiro(i, 'cpf', formatarCPF(e.target.value))} />
              </Campo>
              <Campo>
                <Rotulo>Data de nascimento</Rotulo>
                <PillInput type="date" required aria-label={`Nascimento passageiro ${i + 1}`} value={p.data_nascimento} onChange={(e) => atualizarPassageiro(i, 'data_nascimento', e.target.value)} />
              </Campo>
            </Row>
          </PassageiroBloco>
        ))}

        {erro && <ErrorText>{erro}</ErrorText>}

        <Counter>
          <span>
            <CounterButton type="button" onClick={() => ajustarQtd(qtd + 1)} aria-label="Adicionar pessoa">+</CounterButton>
            {qtd} pessoa{qtd > 1 ? 's' : ''}
            <CounterButton type="button" onClick={() => ajustarQtd(qtd - 1)} aria-label="Remover pessoa">-</CounterButton>
          </span>
          <ConfirmButton type="button" onClick={confirmar} disabled={enviando}>
            {enviando ? 'Confirmando…' : 'Confirmar Reserva'}
          </ConfirmButton>
        </Counter>
      </Card>
      <Back to="/">Voltar à página inicial</Back>
    </Page>
  )
}

export default Reserva

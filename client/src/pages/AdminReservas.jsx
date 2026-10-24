// ===========================================================================
// IMF TURISMO — Gerenciamento de Reservas (seção 3.10)
// Filtros por status + confirmação manual do pagamento (combinado no
// WhatsApp) e cancelamento manual pelo admin (RF06), com confirmação por ser
// ação sensível. Tabela enriquecida com cliente e destino.
// ===========================================================================

import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { api } from '../lib/api.js'
import { colors } from '../theme.js'

const Title = styled.h1`
  color: ${colors.navy};
  font-weight: 800;
  font-size: 1.9rem;
  margin-bottom: 1.25rem;
`

const Filters = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`

const FilterButton = styled.button`
  border: 0;
  border-radius: 999px;
  padding: 0.45rem 1.1rem;
  font-size: 0.85rem;
  font-weight: 700;
  background-color: ${(props) => (props.$ativo ? colors.primary : colors.inputBg)};
  color: ${(props) => (props.$ativo ? '#fff' : colors.navy)};
`

const Card = styled.section`
  background-color: ${colors.background};
  border-radius: 0.25rem;
  padding: 1.25rem;
  box-shadow: 0 8px 24px rgb(15 45 82 / 0.08);
  overflow-x: auto;
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
`

const ConfirmButton = styled.button`
  border: 0;
  border-radius: 999px;
  background-color: ${colors.successDark};
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.35rem 0.8rem;
`

const Actions = styled.div`
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
`

const Feedback = styled.p`
  color: ${colors.textMuted};
`

// O filtro usa o status técnico; o rótulo fala a língua do negócio.
const FILTROS = [
  { valor: 'Todas', rotulo: 'Todas' },
  { valor: 'pendente', rotulo: 'Aguardando pagamento' },
  { valor: 'confirmada', rotulo: 'Confirmadas' },
  { valor: 'cancelada', rotulo: 'Canceladas' },
]

const ROTULOS_STATUS = {
  pendente: 'Aguardando pagamento',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
}

function AdminReservas() {
  const [filtro, setFiltro] = useState('Todas')
  const [reservas, setReservas] = useState([])
  const [mapaClientes, setMapaClientes] = useState({})
  const [mapaDestinos, setMapaDestinos] = useState({})
  const [erro, setErro] = useState('')

  async function carregar(status) {
    setErro('')
    try {
      const params = status && status !== 'Todas' ? { status } : {}
      const [res, cli, exc] = await Promise.all([
        api.get('/api/admin/reservas', { params }),
        api.get('/api/admin/clientes'),
        api.get('/api/admin/excursoes'),
      ])
      setReservas(res.data)
      setMapaClientes(Object.fromEntries((cli.data ?? []).map((c) => [c.id_cliente, c.nome_cliente])))
      setMapaDestinos(Object.fromEntries((exc.data ?? []).map((e) => [e.id_excursao, e.destino])))
    } catch {
      setErro('Não foi possível carregar as reservas.')
    }
  }

  useEffect(() => {
    carregar(filtro)
  }, [filtro])

  async function confirmarPagamento(idReserva) {
    // Ação positiva, mas altera o status: uma confirmação simples evita clique errado.
    if (!window.confirm('Confirmar o pagamento desta reserva?')) return
    try {
      await api.patch(`/api/admin/reservas/${idReserva}/confirmar`)
      await carregar(filtro)
    } catch (err) {
      window.alert(err?.response?.data?.detail ?? 'Não foi possível confirmar o pagamento.')
    }
  }

  async function cancelarManual(idReserva) {
    // Cancelamento pelo admin exige confirmação dupla (seção 2.1).
    if (!window.confirm('Cancelar manualmente esta reserva?')) return
    if (!window.confirm('Confirmar cancelamento definitivo?')) return
    try {
      await api.patch(`/api/admin/reservas/${idReserva}/cancelar`)
      await carregar(filtro)
    } catch (err) {
      window.alert(err?.response?.data?.detail ?? 'Não foi possível cancelar.')
    }
  }

  return (
    <>
      <Title>Reservas</Title>
      <Filters>
        {FILTROS.map((f) => (
          <FilterButton
            key={f.valor}
            type="button"
            $ativo={filtro === f.valor}
            onClick={() => setFiltro(f.valor)}
          >
            {f.rotulo}
          </FilterButton>
        ))}
      </Filters>
      <Card>
        {erro && <Feedback>{erro}</Feedback>}
        <Table>
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Cliente</Th>
              <Th>Destino</Th>
              <Th>Vagas</Th>
              <Th>Status</Th>
              <Th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {reservas.map((r) => (
              <tr key={r.id_reserva}>
                <Td>{r.id_reserva}</Td>
                <Td>{mapaClientes[r.id_cliente] ?? `Cliente ${r.id_cliente}`}</Td>
                <Td>{mapaDestinos[r.id_excursao] ?? `Excursão ${r.id_excursao}`}</Td>
                <Td>{r.qtd_vagas}</Td>
                <Td>{ROTULOS_STATUS[r.status] ?? r.status}</Td>
                <Td>
                  <Actions>
                    {r.status === 'pendente' && (
                      <ConfirmButton
                        type="button"
                        onClick={() => confirmarPagamento(r.id_reserva)}
                      >
                        Confirmar pagamento
                      </ConfirmButton>
                    )}
                    {r.status !== 'cancelada' && (
                      <DangerButton type="button" onClick={() => cancelarManual(r.id_reserva)}>
                        Cancelar
                      </DangerButton>
                    )}
                  </Actions>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {reservas.length === 0 && !erro && <Feedback>Nenhuma reserva neste filtro.</Feedback>}
      </Card>
    </>
  )
}

export default AdminReservas

// ===========================================================================
// IMF TURISMO — Painel Administrativo (Página 6, seção 3.8)
// Dois cards em gradiente verde com os totais + tabela de reservas recentes
// (Cliente | Destino | Vagas). Sem ações nesta tela — confirmar/recusar fica
// em /admin/reservas (seção 3.10).
// ===========================================================================

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { api } from '../lib/api.js'
import { colors } from '../theme.js'

const Title = styled.h1`
  color: ${colors.navy};
  font-weight: 800;
  font-size: 1.9rem;
  margin-bottom: 1.25rem;
`

const Cards = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
`

const TotalCard = styled.div`
  width: 130px;
  height: 130px;
  border-radius: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  background-image: linear-gradient(135deg, ${colors.successGradient[0]}, ${colors.successGradient[1]});
`

const TotalNumber = styled.strong`
  font-size: 1.6rem;
  font-weight: 800;
`

const TotalLabel = styled.span`
  font-size: 0.7rem;
  text-align: center;
`

const TableCard = styled.section`
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
  color: ${colors.navy};
  background-color: #f3f4f6;
  padding: 0.6rem;
  font-weight: 600;
`

const Td = styled.td`
  padding: 0.6rem;
  border-top: 1px solid #f3f4f6;
  color: ${colors.navy};
`

const Details = styled(Link)`
  color: ${colors.primary};
  font-size: 0.8rem;
`

const Feedback = styled.p`
  color: ${colors.textMuted};
`

function AdminDashboard() {
  const [totais, setTotais] = useState({ total_reservas: 0, total_clientes: 0 })
  const [recentes, setRecentes] = useState([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregar() {
      try {
        const [dash, reservas, clientes, excursoes] = await Promise.all([
          api.get('/api/admin/dashboard'),
          api.get('/api/admin/reservas'),
          api.get('/api/admin/clientes'),
          api.get('/api/admin/excursoes'),
        ])
        setTotais(dash.data)
        // Enriquece as 5 mais recentes com nome do cliente e destino.
        const mapaClientes = Object.fromEntries(
          (clientes.data ?? []).map((c) => [c.id_cliente, c.nome_cliente]),
        )
        const mapaDestinos = Object.fromEntries(
          (excursoes.data ?? []).map((e) => [e.id_excursao, e.destino]),
        )
        setRecentes(
          (reservas.data ?? []).slice(0, 5).map((r) => ({
            ...r,
            cliente_nome: mapaClientes[r.id_cliente] ?? `Cliente ${r.id_cliente}`,
            destino: mapaDestinos[r.id_excursao] ?? `Excursão ${r.id_excursao}`,
          })),
        )
      } catch {
        setErro('Não foi possível carregar o painel.')
      }
    }
    carregar()
  }, [])

  return (
    <>
      <Title>Painel Administrativo</Title>
      {erro && <Feedback>{erro}</Feedback>}
      <Cards>
        <TotalCard>
          <TotalNumber>{totais.total_reservas}</TotalNumber>
          <TotalLabel>Total de reservas</TotalLabel>
        </TotalCard>
        <TotalCard>
          <TotalNumber>{totais.total_clientes}</TotalNumber>
          <TotalLabel>Total de Clientes</TotalLabel>
        </TotalCard>
      </Cards>
      <TableCard>
        <Table>
          <thead>
            <tr>
              <Th>Cliente</Th>
              <Th>Destino</Th>
              <Th>Vagas</Th>
              <Th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {recentes.map((r) => (
              <tr key={r.id_reserva}>
                <Td>{r.cliente_nome}</Td>
                <Td>{r.destino}</Td>
                <Td>{r.qtd_vagas}</Td>
                <Td>
                  <Details to="/admin/reservas">Ver detalhes</Details>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {recentes.length === 0 && !erro && <Feedback>Nenhuma reserva recente.</Feedback>}
      </TableCard>
    </>
  )
}

export default AdminDashboard

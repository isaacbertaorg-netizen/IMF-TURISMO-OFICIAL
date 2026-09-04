// ===========================================================================
// IMF TURISMO — Gerenciamento de Clientes (seção 3.11)
// Lista somente leitura com dados de contato. Nunca exibe senha/hash — a API
// já filtra esses campos (ver admin_service.listar_clientes).
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

const Feedback = styled.p`
  color: ${colors.textMuted};
`

function AdminClientes() {
  const [clientes, setClientes] = useState([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregar() {
      try {
        const resp = await api.get('/api/admin/clientes')
        setClientes(resp.data)
      } catch {
        setErro('Não foi possível carregar os clientes.')
      }
    }
    carregar()
  }, [])

  return (
    <>
      <Title>Clientes</Title>
      <Card>
        {erro && <Feedback>{erro}</Feedback>}
        <Table>
          <thead>
            <tr>
              <Th>Nome</Th>
              <Th>E-mail</Th>
              <Th>Telefone</Th>
              <Th>Cidade/UF</Th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id_cliente}>
                <Td>{c.nome_cliente}</Td>
                <Td>{c.email}</Td>
                <Td>{c.telefone}</Td>
                <Td>{[c.cidade, c.uf].filter(Boolean).join('/')}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {clientes.length === 0 && !erro && <Feedback>Nenhum cliente cadastrado.</Feedback>}
      </Card>
    </>
  )
}

export default AdminClientes

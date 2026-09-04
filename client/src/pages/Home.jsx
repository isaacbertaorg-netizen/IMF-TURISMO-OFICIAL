// ===========================================================================
// IMF TURISMO — Tela Inicial / Listagem de Excursões (seção 3.1 do PRODUCT.md)
// Título navy + filtros RF02 (destino, data, faixa de preço) em inputs pílula
// + cards empilhados. Consome GET /api/excursoes com query params.
// ===========================================================================

import { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { colors } from '../theme.js'
import { api } from '../lib/api.js'
import ExcursionCard from '../components/ExcursionCard.jsx'

const Page = styled.main`
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
`

const Title = styled.h1`
  color: ${colors.navy};
  font-weight: 800;
  font-size: 2.6rem;
  text-align: center;
  margin: 1rem 0 1.5rem;
`

const Filters = styled.form`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
`

const PillInput = styled.input`
  flex: 1 1 140px;
  min-width: 120px;
  border: 0;
  border-radius: 999px;
  background-color: ${colors.inputBg};
  padding: 0.6rem 1rem;
  color: ${colors.navy};

  &::placeholder {
    color: ${colors.textMuted};
  }
`

const FilterButton = styled.button`
  border: 0;
  border-radius: 999px;
  background-color: ${colors.primary};
  color: #fff;
  font-weight: 700;
  padding: 0.6rem 1.4rem;
`

const ClearButton = styled.button`
  border: 0;
  border-radius: 999px;
  background-color: transparent;
  color: ${colors.textMuted};
  padding: 0.6rem 1rem;
`

const List = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`

const Feedback = styled.p`
  text-align: center;
  color: ${colors.textMuted};
  padding: 2rem 0;
`

function Home() {
  const [itens, setItens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [filtros, setFiltros] = useState({
    destino: '',
    data_inicio: '',
    data_fim: '',
    preco_min: '',
    preco_max: '',
  })

  const buscar = useCallback(async (params) => {
    setCarregando(true)
    setErro('')
    try {
      // Remove filtros vazios para não poluir a query string.
      const query = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined),
      )
      const resp = await api.get('/api/excursoes', { params: query })
      setItens(resp.data ?? [])
    } catch {
      // Lista real do banco; sem placeholder embutido no front.
      setErro('Não foi possível carregar os pacotes. Tente novamente em instantes.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    buscar({})
  }, [buscar])

  function atualizar(campo, valor) {
    setFiltros((atual) => ({ ...atual, [campo]: valor }))
  }

  function aplicarFiltros(event) {
    event.preventDefault()
    buscar(filtros)
  }

  function limparFiltros() {
    const vazio = { destino: '', data_inicio: '', data_fim: '', preco_min: '', preco_max: '' }
    setFiltros(vazio)
    buscar(vazio)
  }

  return (
    <Page>
      <Title>Confira nossos pacotes!</Title>
      <Filters onSubmit={aplicarFiltros}>
        <PillInput
          placeholder="Destino"
          value={filtros.destino}
          onChange={(e) => atualizar('destino', e.target.value)}
        />
        <PillInput
          type="date"
          aria-label="Data de ida"
          value={filtros.data_inicio}
          onChange={(e) => atualizar('data_inicio', e.target.value)}
        />
        <PillInput
          type="date"
          aria-label="Data de volta"
          value={filtros.data_fim}
          onChange={(e) => atualizar('data_fim', e.target.value)}
        />
        <PillInput
          type="number"
          min="0"
          placeholder="Preço mín."
          value={filtros.preco_min}
          onChange={(e) => atualizar('preco_min', e.target.value)}
        />
        <PillInput
          type="number"
          min="0"
          placeholder="Preço máx."
          value={filtros.preco_max}
          onChange={(e) => atualizar('preco_max', e.target.value)}
        />
        <FilterButton type="submit">Filtrar</FilterButton>
        <ClearButton type="button" onClick={limparFiltros}>
          Limpar
        </ClearButton>
      </Filters>

      {carregando && <Feedback>Carregando pacotes…</Feedback>}
      {!carregando && erro && <Feedback>{erro}</Feedback>}
      {!carregando && !erro && itens.length === 0 && (
        <Feedback>Nenhum pacote encontrado para os filtros informados.</Feedback>
      )}
      {!carregando && !erro && itens.length > 0 && (
        <List>
          {itens.map((excursao) => (
            <ExcursionCard key={excursao.id_excursao} excursao={excursao} />
          ))}
        </List>
      )}
    </Page>
  )
}

export default Home

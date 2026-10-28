// ===========================================================================
// IMF TURISMO — estado global dos favoritos do cliente
// Busca a lista ao autenticar, mantém um Set de ids para marcar os cards e
// faz inclusão/remoção otimista (com rollback se a API falhar).
// ===========================================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, mensagemErro } from './api.js'
import { useAuth } from './auth.jsx'

const FavoritosContext = createContext(null)

export function FavoritosProvider({ children }) {
  const { autenticado, ehAdmin } = useAuth()
  const [favoritos, setFavoritos] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [alternando, setAlternando] = useState(null)

  const carregar = useCallback(async () => {
    if (!autenticado || ehAdmin) {
      setFavoritos([])
      setCarregando(false)
      return
    }

    setCarregando(true)
    try {
      const { data } = await api.get('/api/favoritos')
      setFavoritos(data ?? [])
    } catch {
      setFavoritos([])
    } finally {
      setCarregando(false)
    }
  }, [autenticado, ehAdmin])

  useEffect(() => {
    carregar()
  }, [carregar])

  const ids = useMemo(
    () => new Set(favoritos.map((item) => Number(item.id_excursao))),
    [favoritos],
  )

  const ehFavorito = useCallback(
    (idExcursao) => ids.has(Number(idExcursao)),
    [ids],
  )

  const alternarFavorito = useCallback(
    async (idExcursao) => {
      if (!autenticado) return { precisaLogin: true }
      if (ehAdmin) return { erro: 'Apenas clientes podem salvar favoritos.' }

      const id = Number(idExcursao)
      const jaFavorito = ids.has(id)
      const estadoAnterior = favoritos
      setAlternando(id)

      // Atualização otimista: o botão responde imediatamente.
      if (jaFavorito) {
        setFavoritos((atual) =>
          atual.filter((item) => Number(item.id_excursao) !== id),
        )
      }

      try {
        if (jaFavorito) {
          await api.delete(`/api/favoritos/${id}`)
        } else {
          const { data } = await api.post(`/api/favoritos/${id}`)
          setFavoritos((atual) => {
            if (atual.some((item) => Number(item.id_excursao) === id)) return atual
            return [data, ...atual]
          })
        }
        return { ok: true }
      } catch (err) {
        setFavoritos(estadoAnterior)
        return {
          erro: mensagemErro(err, 'Não foi possível atualizar os favoritos.'),
        }
      } finally {
        setAlternando(null)
      }
    },
    [autenticado, ehAdmin, ids, favoritos],
  )

  const valor = useMemo(
    () => ({
      favoritos,
      carregando,
      alternando,
      ehFavorito,
      alternarFavorito,
    }),
    [favoritos, carregando, alternando, ehFavorito, alternarFavorito],
  )

  return <FavoritosContext.Provider value={valor}>{children}</FavoritosContext.Provider>
}

export function useFavoritos() {
  const ctx = useContext(FavoritosContext)
  if (!ctx) throw new Error('useFavoritos deve ser usado dentro de FavoritosProvider')
  return ctx
}

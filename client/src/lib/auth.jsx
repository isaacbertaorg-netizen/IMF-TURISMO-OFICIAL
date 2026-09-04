// ===========================================================================
// IMF TURISMO — sessão do usuário (JWT próprio do back-end)
// Guarda token + papel em localStorage. O id vem do token; nunca do body
// (seção 6.2 do PRODUCT.md). Papel: 'cliente' ou 'admin'.
// ===========================================================================

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { api } from './api.js'

const AuthContext = createContext(null)

function lerSessao() {
  return {
    token: localStorage.getItem('imf_token'),
    papel: localStorage.getItem('imf_papel'),
  }
}

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(lerSessao)

  const salvar = useCallback((accessToken, papel) => {
    localStorage.setItem('imf_token', accessToken)
    localStorage.setItem('imf_papel', papel)
    setSessao({ token: accessToken, papel })
  }, [])

  const sair = useCallback(() => {
    localStorage.removeItem('imf_token')
    localStorage.removeItem('imf_papel')
    setSessao({ token: null, papel: null })
  }, [])

  const loginCliente = useCallback(
    async (email, senha) => {
      const resp = await api.post('/api/login', { email, senha })
      salvar(resp.data.access_token, 'cliente')
    },
    [salvar],
  )

  const loginAdmin = useCallback(
    async (login, senha) => {
      const resp = await api.post('/api/admin/login', { login, senha })
      salvar(resp.data.access_token, 'admin')
    },
    [salvar],
  )

  const valor = useMemo(
    () => ({
      token: sessao.token,
      papel: sessao.papel,
      autenticado: Boolean(sessao.token),
      ehAdmin: sessao.papel === 'admin',
      loginCliente,
      loginAdmin,
      sair,
    }),
    [sessao, loginCliente, loginAdmin, sair],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}

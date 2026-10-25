// ===========================================================================
// IMF TURISMO — sessão do usuário (JWT próprio do back-end)
// Guarda token + papel em localStorage ("Lembrar de mim", sessão longa) ou
// sessionStorage (sessão do navegador, some ao fechar). O id vem do token;
// nunca do body (seção 6.2 do PRODUCT.md). Papel: 'cliente' ou 'admin'.
// ===========================================================================

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { api } from './api.js'

const AuthContext = createContext(null)

// Descobre onde a sessão está salva. Só um dos dois guarda o token por vez.
function armazenamentoSessao() {
  if (localStorage.getItem('imf_token')) return localStorage
  if (sessionStorage.getItem('imf_token')) return sessionStorage
  return null
}

function lerSessao() {
  const armazenamento = armazenamentoSessao()
  return {
    token: armazenamento?.getItem('imf_token') ?? null,
    papel: armazenamento?.getItem('imf_papel') ?? null,
    fotoPerfil: armazenamento?.getItem('imf_foto_perfil') ?? null,
  }
}

// Remove a sessão dos dois armazenamentos: evita sobrar um token antigo no
// outro local depois de um login com "Lembrar de mim" diferente.
function limparArmazenamentos() {
  for (const armazenamento of [localStorage, sessionStorage]) {
    armazenamento.removeItem('imf_token')
    armazenamento.removeItem('imf_papel')
    armazenamento.removeItem('imf_foto_perfil')
  }
}

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(lerSessao)

  const salvar = useCallback((accessToken, papel, fotoPerfil = null, lembrar = false) => {
    limparArmazenamentos()
    // "Lembrar de mim" sobrevive ao fechar o navegador; sem a opção, a sessão
    // fica só enquanto a aba estiver aberta.
    const armazenamento = lembrar ? localStorage : sessionStorage
    armazenamento.setItem('imf_token', accessToken)
    armazenamento.setItem('imf_papel', papel)
    // A foto é guardada junto da sessão para o avatar da navbar aparecer
    // imediatamente, sem uma requisição extra em cada página.
    if (fotoPerfil) armazenamento.setItem('imf_foto_perfil', fotoPerfil)
    setSessao({ token: accessToken, papel, fotoPerfil })
  }, [])

  const sair = useCallback(() => {
    limparArmazenamentos()
    setSessao({ token: null, papel: null, fotoPerfil: null })
  }, [])

  const atualizarFotoPerfil = useCallback((fotoPerfil) => {
    const armazenamento = armazenamentoSessao() ?? localStorage
    if (fotoPerfil) armazenamento.setItem('imf_foto_perfil', fotoPerfil)
    else armazenamento.removeItem('imf_foto_perfil')
    setSessao((atual) => ({ ...atual, fotoPerfil }))
  }, [])

  const loginCliente = useCallback(
    async (email, senha, lembrar = false) => {
      const resp = await api.post('/api/login', { email, senha, lembrar })
      salvar(resp.data.access_token, 'cliente', resp.data.foto_perfil_url ?? null, lembrar)
    },
    [salvar],
  )

  const loginAdmin = useCallback(
    async (login, senha) => {
      const resp = await api.post('/api/admin/login', { login, senha })
      // O painel administrativo continua com sessão persistente.
      salvar(resp.data.access_token, 'admin', null, true)
    },
    [salvar],
  )

  const valor = useMemo(
    () => ({
      token: sessao.token,
      papel: sessao.papel,
      fotoPerfil: sessao.fotoPerfil,
      autenticado: Boolean(sessao.token),
      ehAdmin: sessao.papel === 'admin',
      loginCliente,
      loginAdmin,
      atualizarFotoPerfil,
      sair,
    }),
    [sessao, loginCliente, loginAdmin, atualizarFotoPerfil, sair],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}

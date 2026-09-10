// ===========================================================================
// IMF TURISMO — cliente HTTP da API
// Usa VITE_API_BASE_URL (ver .env.example). Sem a variável: mesma origem
// (/api, caso do Vercel com back junto) em produção, localhost em dev.
// ===========================================================================

import axios from 'axios'

const baseURL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000')

export const api = axios.create({
  baseURL,
  timeout: 10000,
})

// Anexa o JWT de sessão em todas as requisições autenticadas.
// O token vive em localStorage (chave imf_token); rotas públicas seguem sem header.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('imf_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Formata a data ISO (YYYY-MM-DD) para o padrão brasileiro DD/MM/YYYY.
// Só para colunas DATE (sem hora): fatiar a string evita o dia trocar por fuso.
export function formatarDataBR(dataISO) {
  if (!dataISO) return ''
  const [ano, mes, dia] = String(dataISO).slice(0, 10).split('-')
  if (!ano || !mes || !dia) return String(dataISO)
  return `${dia}/${mes}/${ano}`
}

// Formata um TIMESTAMP do banco (ex.: data_reserva) no fuso do navegador.
// O Supabase grava em UTC; às 21h59 em Brasília já é dia seguinte em UTC,
// então fatiar a string mostraria o dia errado (04/09 em vez de 03/09).
export function formatarDataHoraLocal(dataISO) {
  if (!dataISO) return ''
  const data = new Date(dataISO)
  if (Number.isNaN(data.getTime())) return String(dataISO).slice(0, 10)
  return data.toLocaleDateString('pt-BR')
}
// Extrai mensagem legível do erro da API. O FastAPI retorna `detail` como
// string nas regras de negócio e como lista no erro 422 de validação.
export function mensagemErro(err, padrao) {
  const detalhe = err?.response?.data?.detail
  if (typeof detalhe === 'string' && detalhe) return detalhe
  if (Array.isArray(detalhe) && detalhe.length > 0) {
    return detalhe
      .map((item) => {
        if (typeof item === 'string') return item
        const campo = Array.isArray(item?.loc) ? item.loc[item.loc.length - 1] : null
        return campo ? `${campo}: ${item?.msg ?? ''}` : (item?.msg ?? '')
      })
      .filter(Boolean)
      .join(' ')
  }
  return padrao
}

// Formata o valor por pessoa em moeda brasileira.
export function formatarMoeda(valor) {
  if (valor === null || valor === undefined) return ''
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  })
}

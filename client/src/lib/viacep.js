// ===========================================================================
// IMF TURISMO — busca de endereço por CEP (ViaCEP, sem chave)
// Preenche logradouro/bairro/cidade/UF a partir do CEP digitado.
// ===========================================================================

import { apenasDigitos } from './mascaras.js'

export async function buscarEnderecoPorCep(cep) {
  const digitos = apenasDigitos(cep)
  if (digitos.length !== 8) {
    throw new Error('CEP deve conter 8 dígitos.')
  }
  const resp = await fetch(`https://viacep.com.br/ws/${digitos}/json/`)
  if (!resp.ok) {
    throw new Error('Não foi possível buscar o CEP.')
  }
  const dados = await resp.json()
  if (dados.erro) {
    throw new Error('CEP não encontrado.')
  }
  return {
    logradouro: dados.logradouro ?? '',
    complemento: dados.complemento ?? '',
    bairro: dados.bairro ?? '',
    cidade: dados.localidade ?? '',
    uf: dados.uf ?? '',
  }
}

// ===========================================================================
// IMF TURISMO — campos de endereço com busca automática por CEP (ViaCEP)
// Usado no Cadastro e no Perfil. Ao completar 8 dígitos, busca e preenche
// rua/bairro/cidade/UF (número e complemento o usuário informa).
// ===========================================================================

import { useRef, useState } from 'react'
import styled from 'styled-components'
import { apenasDigitos, formatarCEP } from '../lib/mascaras.js'
import { buscarEnderecoPorCep } from '../lib/viacep.js'
import { colors } from '../theme.js'
import { PillInput } from './AuthLayout.jsx'

const Grid = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`

const Linha = styled.div`
  display: flex;
  gap: 0.6rem;

  @media (width <= 480px) {
    flex-direction: column;
  }
`

const Aviso = styled.p`
  font-size: 0.8rem;
  color: ${colors.textMuted};
  text-align: center;
`

const ErroCep = styled.p`
  font-size: 0.8rem;
  color: ${colors.danger};
  text-align: center;
`

const BuscarButton = styled.button`
  border: 0;
  border-radius: 999px;
  background-color: ${colors.primary};
  color: #fff;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 0.6rem 1.2rem;
  white-space: nowrap;

  &:disabled {
    opacity: 0.5;
  }
`

function EnderecoForm({ valores, onChange }) {
  const [buscando, setBuscando] = useState(false)
  const [erroCep, setErroCep] = useState('')
  const ultimoCepBuscado = useRef('')
  // Contador de requisições: só a resposta mais recente preenche os campos.
  const requisicaoAtual = useRef(0)

  async function buscarPorCep(digitos) {
    if (digitos.length !== 8 || digitos === ultimoCepBuscado.current) return
    ultimoCepBuscado.current = digitos
    const minhaVez = ++requisicaoAtual.current
    setBuscando(true)
    setErroCep('')
    try {
      const end = await buscarEnderecoPorCep(digitos)
      if (minhaVez !== requisicaoAtual.current) return
      if (end.logradouro) onChange('logradouro', end.logradouro)
      if (end.bairro) onChange('bairro', end.bairro)
      if (end.cidade) onChange('cidade', end.cidade)
      if (end.uf) onChange('uf', end.uf)
      if (end.complemento) onChange('complemento', end.complemento)
    } catch (err) {
      if (minhaVez === requisicaoAtual.current) setErroCep(err.message)
    } finally {
      if (minhaVez === requisicaoAtual.current) setBuscando(false)
    }
  }

  function digitarCep(texto) {
    onChange('cep', formatarCEP(texto))
    // Busca automática ao completar 8 dígitos na digitação.
    void buscarPorCep(apenasDigitos(texto))
  }

  return (
    <Grid>
      <Linha>
        <div style={{ flex: 3 }}>
          <PillInput
            placeholder="CEP (00000-000)"
            required
            inputMode="numeric"
            maxLength={9}
            value={valores.cep}
            onChange={(e) => digitarCep(e.target.value)}
          />
        </div>
        <BuscarButton
          type="button"
          disabled={buscando || apenasDigitos(valores.cep).length !== 8}
          onClick={() => buscarPorCep(apenasDigitos(valores.cep))}
        >
          {buscando ? 'Buscando…' : 'Buscar'}
        </BuscarButton>
      </Linha>
      {buscando && <Aviso>Buscando endereço…</Aviso>}
      {erroCep && <ErroCep>{erroCep} Preencha manualmente.</ErroCep>}
      <Linha>
        <div style={{ flex: 3 }}>
          <PillInput
            placeholder="Rua / Avenida"
            required
            minLength={3}
            value={valores.logradouro}
            onChange={(e) => onChange('logradouro', e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <PillInput
            placeholder="Número"
            required
            value={valores.numero}
            onChange={(e) => onChange('numero', e.target.value)}
          />
        </div>
      </Linha>
      <PillInput
        placeholder="Complemento (opcional)"
        value={valores.complemento}
        onChange={(e) => onChange('complemento', e.target.value)}
      />
      <PillInput
        placeholder="Bairro"
        required
        minLength={2}
        value={valores.bairro}
        onChange={(e) => onChange('bairro', e.target.value)}
      />
      <Linha>
        <div style={{ flex: 3 }}>
          <PillInput
            placeholder="Cidade"
            required
            minLength={2}
            value={valores.cidade}
            onChange={(e) => onChange('cidade', e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <PillInput
            placeholder="UF"
            required
            minLength={2}
            maxLength={2}
            value={valores.uf}
            onChange={(e) => onChange('uf', e.target.value.toUpperCase())}
            style={{ textTransform: 'uppercase' }}
          />
        </div>
      </Linha>
    </Grid>
  )
}

export default EnderecoForm

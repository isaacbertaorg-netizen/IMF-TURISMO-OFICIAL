// ===========================================================================
// IMF TURISMO — número de WhatsApp configurado no back-end
// Centraliza a busca para o rodapé e as páginas públicas não repetirem a
// mesma chamada. O fallback aparece na hora e é trocado quando a API responde.
// ===========================================================================

import { useEffect, useState } from 'react'
import { obterWhatsApp, WHATSAPP_PADRAO } from './whatsapp.js'

export function useWhatsApp() {
  const [numero, setNumero] = useState(WHATSAPP_PADRAO)

  useEffect(() => {
    let ativo = true
    obterWhatsApp().then((valor) => {
      if (ativo) setNumero(valor)
    })
    return () => {
      ativo = false
    }
  }, [])

  return numero
}

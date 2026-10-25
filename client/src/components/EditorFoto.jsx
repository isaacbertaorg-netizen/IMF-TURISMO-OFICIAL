// ===========================================================================
// IMF TURISMO — editor da foto de perfil
// Abre antes do upload para o cliente enquadrar a foto: arrastar, aproximar
// (zoom) e girar. O recorte é sempre quadrado porque o avatar é exibido em
// círculo no menu; a saída é gerada em 512x512 para ficar nítida em telas
// grandes sem enviar o arquivo original inteiro.
// ===========================================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { colors } from '../theme.js'

// Tamanho lógico do quadro de edição e da imagem final enviada ao servidor.
const QUADRO = 320
const SAIDA = 512
const ZOOM_MIN = 1
const ZOOM_MAX = 4

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background-color: rgb(15 45 82 / 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`

const Dialog = styled.div`
  width: min(100%, 420px);
  max-height: 100dvh;
  overflow-y: auto;
  background-color: ${colors.background};
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  box-shadow: 0 24px 60px rgb(15 45 82 / 0.35);
`

const Title = styled.h2`
  color: ${colors.navy};
  font-size: 1.15rem;
  font-weight: 800;
  margin: 0;
`

const Hint = styled.p`
  color: ${colors.textMuted};
  font-size: 0.82rem;
  line-height: 1.4;
  margin: 0;
`

const Preview = styled.canvas`
  width: 100%;
  max-width: ${QUADRO}px;
  aspect-ratio: 1;
  align-self: center;
  border-radius: 0.75rem;
  background-color: ${colors.inputBg};
  cursor: grab;
  touch-action: none;

  &:active {
    cursor: grabbing;
  }
`

const Control = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  color: ${colors.navy};
  font-size: 0.82rem;
  font-weight: 600;

  input {
    width: 100%;
    accent-color: ${colors.primary};
  }
`

const Tools = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`

const ToolButton = styled.button`
  border: 1px solid ${colors.inputBg};
  border-radius: 999px;
  background-color: ${colors.backgroundAlt};
  color: ${colors.navy};
  font-weight: 600;
  font-size: 0.8rem;
  padding: 0.45rem 0.9rem;
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
`

const CancelButton = styled.button`
  border: 0;
  border-radius: 999px;
  background-color: transparent;
  color: ${colors.textMuted};
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.55rem 0.9rem;
`

const ConfirmButton = styled.button`
  border: 0;
  border-radius: 999px;
  background-color: ${colors.primary};
  color: #fff;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 0.55rem 1.2rem;

  &:disabled {
    opacity: 0.6;
  }
`

const ErrorText = styled.p`
  color: ${colors.danger};
  font-size: 0.82rem;
  margin: 0;
`

function limitar(valor, minimo, maximo) {
  return Math.min(maximo, Math.max(minimo, valor))
}

// Escala mínima para a imagem cobrir todo o quadro (sem faixas vazias).
function escalaCobertura(fonte) {
  return Math.max(QUADRO / fonte.width, QUADRO / fonte.height)
}

// Quanto a imagem pode andar para os lados sem deixar borda aparecendo.
function limitesDeslocamento(fonte, zoom) {
  const escala = escalaCobertura(fonte) * zoom
  return {
    x: Math.max(0, (fonte.width * escala - QUADRO) / 2),
    y: Math.max(0, (fonte.height * escala - QUADRO) / 2),
  }
}

function limitarDeslocamento(ponto, fonte, zoom) {
  if (!fonte) return ponto
  const limite = limitesDeslocamento(fonte, zoom)
  return {
    x: limitar(ponto.x, -limite.x, limite.x),
    y: limitar(ponto.y, -limite.y, limite.y),
  }
}

// Desenha a imagem girada em um canvas novo. Partimos sempre do arquivo
// original para que girar duas vezes não acumule perda de qualidade.
function girarFonte(original, graus) {
  const trocaLados = graus % 180 !== 0
  const canvas = document.createElement('canvas')
  canvas.width = trocaLados ? original.height : original.width
  canvas.height = trocaLados ? original.width : original.height

  const ctx = canvas.getContext('2d')
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((graus * Math.PI) / 180)
  ctx.drawImage(original, -original.width / 2, -original.height / 2)
  return canvas
}

export default function EditorFoto({ arquivo, enviando, erroEnvio, onCancelar, onConfirmar }) {
  const canvasRef = useRef(null)
  const originalRef = useRef(null)
  const arrastoRef = useRef(null)
  const [fonte, setFonte] = useState(null)
  const [rotacao, setRotacao] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [deslocamento, setDeslocamento] = useState({ x: 0, y: 0 })
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  // Carrega o arquivo escolhido uma única vez. createImageBitmap já aplica a
  // orientação EXIF, então fotos de celular não chegam deitadas.
  useEffect(() => {
    let cancelado = false

    async function carregar() {
      try {
        const imagem = await createImageBitmap(arquivo)
        if (cancelado) {
          imagem.close?.()
          return
        }
        originalRef.current = imagem
        setFonte(imagem)
        setRotacao(0)
        setZoom(1)
        setDeslocamento({ x: 0, y: 0 })
      } catch {
        if (!cancelado) setErro('Não foi possível abrir esta imagem. Tente outro arquivo.')
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [arquivo])

  // Trava o scroll da página enquanto o editor está aberto.
  useEffect(() => {
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = anterior
    }
  }, [])

  // Esc fecha o editor, menos durante o envio.
  useEffect(() => {
    function aoTeclar(evento) {
      if (evento.key === 'Escape' && !enviando) onCancelar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [enviando, onCancelar])

  // Redesenha a prévia a cada ajuste, com máscara circular para mostrar
  // exatamente o que vai aparecer no avatar.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, QUADRO, QUADRO)
    if (!fonte) return

    const escala = escalaCobertura(fonte) * zoom
    const largura = fonte.width * escala
    const altura = fonte.height * escala
    const x = QUADRO / 2 - largura / 2 + deslocamento.x
    const y = QUADRO / 2 - altura / 2 + deslocamento.y

    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(fonte, x, y, largura, altura)

    // Escurece o que fica fora do círculo e desenha o contorno do avatar.
    ctx.save()
    ctx.fillStyle = 'rgb(15 45 82 / 0.55)'
    ctx.beginPath()
    ctx.rect(0, 0, QUADRO, QUADRO)
    ctx.arc(QUADRO / 2, QUADRO / 2, QUADRO / 2 - 2, 0, Math.PI * 2, true)
    ctx.fill()
    ctx.restore()

    ctx.beginPath()
    ctx.arc(QUADRO / 2, QUADRO / 2, QUADRO / 2 - 2, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgb(255 255 255 / 0.9)'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [fonte, zoom, deslocamento])

  const mudarZoom = useCallback(
    (valor) => {
      const novoZoom = Number(valor)
      setZoom(novoZoom)
      setDeslocamento((atual) => limitarDeslocamento(atual, fonte, novoZoom))
    },
    [fonte],
  )

  function aoPressionar(evento) {
    evento.currentTarget.setPointerCapture(evento.pointerId)
    arrastoRef.current = {
      x: evento.clientX,
      y: evento.clientY,
      inicio: deslocamento,
    }
  }

  function aoMover(evento) {
    const arrasto = arrastoRef.current
    if (!arrasto || !fonte) return
    const proximo = {
      x: arrasto.inicio.x + (evento.clientX - arrasto.x),
      y: arrasto.inicio.y + (evento.clientY - arrasto.y),
    }
    setDeslocamento(limitarDeslocamento(proximo, fonte, zoom))
  }

  function aoSoltar() {
    arrastoRef.current = null
  }

  function girar() {
    const original = originalRef.current
    if (!original) return
    const novaRotacao = (rotacao + 90) % 360
    setFonte(girarFonte(original, novaRotacao))
    setRotacao(novaRotacao)
    setZoom(1)
    setDeslocamento({ x: 0, y: 0 })
  }

  function redefinir() {
    setFonte(originalRef.current)
    setRotacao(0)
    setZoom(1)
    setDeslocamento({ x: 0, y: 0 })
  }

  // Converte o enquadramento atual em um quadrado de 512x512. O recorte é
  // feito no canvas (e não no servidor) para o cliente ver o resultado antes
  // de enviar e para reduzir o tamanho do arquivo.
  async function confirmar() {
    if (!fonte || enviando) return
    const escala = escalaCobertura(fonte) * zoom
    const largura = fonte.width * escala
    const altura = fonte.height * escala
    const x = QUADRO / 2 - largura / 2 + deslocamento.x
    const y = QUADRO / 2 - altura / 2 + deslocamento.y
    const tamanhoOrigem = QUADRO / escala

    const canvas = document.createElement('canvas')
    canvas.width = SAIDA
    canvas.height = SAIDA
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(
      fonte,
      -x / escala,
      -y / escala,
      tamanhoOrigem,
      tamanhoOrigem,
      0,
      0,
      SAIDA,
      SAIDA,
    )

    const blob = await new Promise((resolver) => canvas.toBlob(resolver, 'image/jpeg', 0.9))
    if (blob) onConfirmar(blob)
  }

  return (
    <Overlay role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !enviando && onCancelar()}>
      <Dialog role="dialog" aria-modal="true" aria-label="Ajustar foto de perfil">
        <Title>Ajustar foto</Title>
        <Hint>
          Arraste para posicionar, use o zoom para aproximar e gire se a foto estiver deitada.
          O círculo mostra como a foto vai aparecer no menu.
        </Hint>

        <Preview
          ref={canvasRef}
          width={QUADRO}
          height={QUADRO}
          onPointerDown={aoPressionar}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onPointerCancel={aoSoltar}
        />

        {carregando && <Hint>Carregando imagem…</Hint>}
        {(erro || erroEnvio) && <ErrorText>{erro || erroEnvio}</ErrorText>}

        <Control>
          Zoom
          <input
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step="0.01"
            value={zoom}
            onChange={(e) => mudarZoom(e.target.value)}
            disabled={!fonte || carregando}
          />
        </Control>

        <Tools>
          <ToolButton type="button" onClick={girar} disabled={!fonte || enviando}>
            Girar 90°
          </ToolButton>
          <ToolButton type="button" onClick={redefinir} disabled={!fonte || enviando}>
            Redefinir
          </ToolButton>
        </Tools>

        <Actions>
          <CancelButton type="button" onClick={onCancelar} disabled={enviando}>
            Cancelar
          </CancelButton>
          <ConfirmButton type="button" onClick={confirmar} disabled={!fonte || carregando || enviando}>
            {enviando ? 'Enviando…' : 'Usar foto'}
          </ConfirmButton>
        </Actions>
      </Dialog>
    </Overlay>
  )
}

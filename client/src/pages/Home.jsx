// ===========================================================================
// IMF TURISMO — Página inicial
// Apresenta a empresa, as próximas excursões e a experiência real de quem
// viaja com a IMF. A listagem completa fica em /excursoes.
// ===========================================================================

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { api, formatarDataBR, formatarMoeda } from '../lib/api.js'
import { EMAIL_CONTATO, HORARIO_ATENDIMENTO, TAGLINE } from '../lib/contato.js'
import { useWhatsApp } from '../lib/useWhatsApp.js'
import { linkWhatsApp } from '../lib/whatsapp.js'
import { colors } from '../theme.js'
import cardCaldas from '../assets/card-caldas-novas.jpg'
import cardMaceio from '../assets/card-maceio.webp'
import fotoBingo from '../assets/home/bingo.jpg'
import fotoFamilia from '../assets/home/familia-piscina.jpg'
import fotoGrupoLago from '../assets/home/grupo-lago.jpg'
import fotoGrupoPiscina from '../assets/home/grupo-piscina.jpg'
import fotoGrupoPlanta from '../assets/home/grupo-planta.jpg'
import fotoGrupoRua from '../assets/home/grupo-rua.jpg'
import fotoIara from '../assets/home/iara.jpg'
import fotoOnibus from '../assets/home/onibus.jpg'

const Page = styled.main`
  background-color: ${colors.background};
`

const Hero = styled.section`
  background: linear-gradient(135deg, #f4f8fd 0%, #ffffff 52%, #eaf2fc 100%);
  border-bottom: 1px solid #e5e7eb;
`

const HeroInner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 3.25rem 1rem 3.5rem;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 2.5rem;
  align-items: center;

  @media (width <= 900px) {
    grid-template-columns: 1fr;
    gap: 2rem;
    padding-top: 2rem;
  }
`

const HeroText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`

const Eyebrow = styled.p`
  color: ${colors.primary};
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 0.7rem;
`

const Title = styled.h1`
  color: ${colors.navy};
  font-size: clamp(2rem, 4.6vw, 3.3rem);
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -0.02em;
`

const TitleHighlight = styled.span`
  color: ${colors.primary};
`

const Subtitle = styled.p`
  color: #4b5563;
  font-size: 1rem;
  line-height: 1.65;
  margin-top: 1rem;
  max-width: 540px;
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.5rem;
`

const PrimaryAction = styled(Link)`
  border-radius: 999px;
  background-color: ${colors.primary};
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0.8rem 1.35rem;
  box-shadow: 0 8px 18px rgb(30 136 229 / 0.22);
`

const WhatsAppAction = styled.a`
  border-radius: 999px;
  background-color: ${colors.successDark};
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0.8rem 1.35rem;

  &:hover {
    filter: brightness(0.95);
  }
`

const TrustList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.1rem;
  margin-top: 1.5rem;
  padding: 0;
  list-style: none;
`

const TrustItem = styled.li`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: ${colors.textMuted};
  font-size: 0.82rem;
`

const TrustCheck = styled.span`
  color: ${colors.successDark};
  font-weight: 800;
`

const Collage = styled.div`
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  grid-template-rows: 1fr 1fr;
  gap: 0.75rem;
  min-height: 430px;

  @media (width <= 900px) {
    width: 100%;
    max-width: 560px;
    min-height: 320px;
    margin: 0 auto;
  }
`

const CollageMain = styled.img`
  grid-row: 1 / 3;
  width: 100%;
  height: 100%;
  min-height: 430px;
  object-fit: cover;
  border-radius: 1.25rem;
  box-shadow: 0 18px 40px rgb(15 45 82 / 0.18);

  @media (width <= 900px) {
    min-height: 320px;
  }
`

const CollageSmall = styled.img`
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: cover;
  border-radius: 1rem;
  box-shadow: 0 10px 24px rgb(15 45 82 / 0.14);
`

const Section = styled.section`
  max-width: 1100px;
  margin: 0 auto;
  padding: 3.5rem 1rem;
`

const SectionHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
`

const SectionTitle = styled.h2`
  color: ${colors.navy};
  font-size: clamp(1.55rem, 3vw, 2rem);
  font-weight: 800;
  line-height: 1.2;
`

const SectionText = styled.p`
  color: ${colors.textMuted};
  font-size: 0.95rem;
  line-height: 1.6;
  max-width: 620px;
  margin-top: 0.35rem;
`

const SeeAll = styled(Link)`
  color: ${colors.primary};
  font-weight: 700;
  font-size: 0.9rem;

  &:hover {
    text-decoration: underline;
  }
`

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;

  @media (width <= 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (width <= 640px) {
    grid-template-columns: 1fr;
  }
`

const Card = styled.article`
  background-color: #fff;
  border-radius: 1.25rem;
  box-shadow: 0 8px 24px rgb(15 45 82 / 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`

const CardPhoto = styled.img`
  width: 100%;
  height: 180px;
  object-fit: cover;
`

const CardBody = styled.div`
  padding: 1rem 1rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  flex: 1;
`

const CardTitle = styled.h3`
  color: ${colors.navy};
  font-size: 1.15rem;
  font-weight: 800;
`

const CardMeta = styled.p`
  color: ${colors.textMuted};
  font-size: 0.85rem;
  line-height: 1.45;
`

const CardBottom = styled.div`
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 0.6rem;
`

const CardPrice = styled.span`
  display: block;
  color: ${colors.navy};
  font-weight: 800;
  font-size: 1rem;
`

const Vacancies = styled.span`
  display: inline-block;
  margin-top: 0.3rem;
  font-size: 0.72rem;
  color: ${colors.successDark};
  background-color: #ecfdf5;
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  font-weight: 700;
`

const CardLink = styled(Link)`
  background-color: ${colors.primary};
  color: #fff;
  font-weight: 700;
  font-size: 0.8rem;
  border-radius: 999px;
  padding: 0.45rem 0.9rem;
`

// Preenche a terceira coluna quando a API retorna menos de três destaques,
// mantendo o convite para falar com a equipe no lugar de um espaço vazio.
const CtaCard = styled.aside`
  grid-column: ${(props) => (props.$span ? 'span 2' : 'auto')};
  background: linear-gradient(160deg, ${colors.navy} 0%, #163f70 100%);
  border-radius: 1.25rem;
  padding: 1.5rem;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.7rem;

  @media (width <= 900px) {
    grid-column: auto;
  }
`

const CtaCardEyebrow = styled.p`
  color: #93c5fd;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`

const CtaCardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.3;
`

const CtaCardText = styled.p`
  color: #dbeafe;
  font-size: 0.88rem;
  line-height: 1.55;
`

const CtaCardLink = styled.a`
  align-self: flex-start;
  border-radius: 999px;
  background-color: ${colors.successDark};
  color: #fff;
  font-weight: 700;
  font-size: 0.82rem;
  padding: 0.55rem 1rem;
  margin-top: 0.35rem;
`

const Feedback = styled.p`
  color: ${colors.textMuted};
  font-size: 0.95rem;
  text-align: center;
  padding: 2rem 0;
`

const ExperienceSection = styled.section`
  background-color: ${colors.backgroundAlt};
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
`

const ExperienceInner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 3.5rem 1rem;
`

const Carousel = styled.section`
  position: relative;
  border-radius: 1.25rem;
  overflow: hidden;
  background-color: ${colors.navy};
  box-shadow: 0 12px 32px rgb(15 45 82 / 0.14);
`

const CarouselViewport = styled.div`
  overflow: hidden;
  aspect-ratio: 3 / 2;

  @media (width <= 800px) {
    aspect-ratio: 1 / 1;
  }

  @media (width <= 520px) {
    aspect-ratio: 4 / 5;
  }
`

const CarouselTrack = styled.div`
  display: flex;
  height: 100%;
  transform: translateX(${(props) => -props.$indice * 100}%);
  transition: transform 0.55s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const CarouselSlide = styled.figure`
  position: relative;
  flex: 0 0 100%;
  height: 100%;
  margin: 0;
`

const CarouselPhoto = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const CarouselCaption = styled.figcaption`
  position: absolute;
  inset: auto 0 0 0;
  padding: 3.5rem 1.5rem 1.9rem;
  background: linear-gradient(to top, rgb(15 45 82 / 0.92), transparent);
  color: #fff;
  font-weight: 800;
  font-size: 1.15rem;

  @media (width <= 520px) {
    padding: 2.4rem 1rem 1.6rem;
    font-size: 0.95rem;
  }
`

const CarouselButton = styled.button`
  position: absolute;
  top: 50%;
  ${(props) => (props.$lado === 'esquerda' ? 'left: 0.75rem;' : 'right: 0.75rem;')}
  transform: translateY(-50%);
  width: 2.6rem;
  height: 2.6rem;
  border: 0;
  border-radius: 999px;
  background-color: rgb(15 45 82 / 0.55);
  color: #fff;
  font-size: 1.7rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background-color: rgb(15 45 82 / 0.82);
  }

  @media (width <= 520px) {
    width: 2rem;
    height: 2rem;
    font-size: 1.25rem;
  }
`

const CarouselDots = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0.75rem;
  display: flex;
  justify-content: center;
  gap: 0.4rem;
`

const CarouselDot = styled.button`
  width: 0.5rem;
  height: 0.5rem;
  border: 0;
  padding: 0;
  border-radius: 999px;
  cursor: pointer;
  background-color: ${(props) => (props.$ativo ? '#fff' : 'rgb(255 255 255 / 0.45)')};
  transition: background-color 0.2s ease;
`

const OwnerCard = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 2rem;
  align-items: center;
  background-color: #fff;
  border-radius: 1.5rem;
  box-shadow: 0 8px 24px rgb(15 45 82 / 0.08);
  padding: 1.5rem;

  @media (width <= 800px) {
    grid-template-columns: 1fr;
  }
`

const OwnerPhoto = styled.img`
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  object-position: center 22%;
  border-radius: 1rem;
`

const OwnerContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.85rem;
`

const OwnerTitle = styled.h2`
  color: ${colors.navy};
  font-size: clamp(1.4rem, 2.8vw, 1.9rem);
  font-weight: 800;
  line-height: 1.25;
`

const Paragraph = styled.p`
  color: #374151;
  font-size: 0.95rem;
  line-height: 1.65;
`

const Credentials = styled.p`
  color: ${colors.navy};
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.5;
`

const OwnerActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.35rem;
`

const SecondaryAction = styled(Link)`
  border: 1px solid ${colors.navy};
  border-radius: 999px;
  color: ${colors.navy};
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0.65rem 1.2rem;

  &:hover {
    background-color: ${colors.navy};
    color: #fff;
  }
`

const BenefitsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;

  @media (width <= 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (width <= 560px) {
    grid-template-columns: 1fr;
  }
`

const BenefitCard = styled.div`
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 1.25rem;
`

const BenefitNumber = styled.span`
  display: inline-flex;
  width: 2rem;
  height: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background-color: #eaf2fc;
  color: ${colors.primary};
  font-size: 0.8rem;
  font-weight: 800;
  margin-bottom: 0.75rem;
`

const BenefitTitle = styled.h3`
  color: ${colors.navy};
  font-size: 1rem;
  font-weight: 800;
  margin-bottom: 0.35rem;
`

const BenefitText = styled.p`
  color: #4b5563;
  font-size: 0.88rem;
  line-height: 1.55;
`

const HowSection = styled.section`
  background-color: ${colors.backgroundAlt};
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
`

const HowInner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 3.5rem 1rem;
`

const Steps = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;

  @media (width <= 800px) {
    grid-template-columns: 1fr;
  }
`

const Step = styled.div`
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 1.25rem;
`

const StepNumber = styled.span`
  display: block;
  color: ${colors.accent};
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 0.6rem;
`

const StepTitle = styled.h3`
  color: ${colors.navy};
  font-size: 1rem;
  font-weight: 800;
  margin-bottom: 0.35rem;
`

const StepText = styled.p`
  color: #4b5563;
  font-size: 0.88rem;
  line-height: 1.55;
`

const FaqList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 820px;
`

const FaqItem = styled.details`
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.9rem;
  padding: 1rem 1.1rem;
`

const FaqQuestion = styled.summary`
  cursor: pointer;
  color: ${colors.navy};
  font-weight: 700;
  font-size: 0.95rem;

  &:hover {
    color: ${colors.primary};
  }
`

const FaqAnswer = styled.p`
  color: #374151;
  font-size: 0.9rem;
  line-height: 1.6;
  margin-top: 0.6rem;
`

const FaqLink = styled(Link)`
  display: inline-block;
  color: ${colors.primary};
  font-weight: 700;
  font-size: 0.9rem;
  margin-top: 1rem;

  &:hover {
    text-decoration: underline;
  }
`

const Cta = styled.section`
  background-color: ${colors.navy};
  color: #fff;
`

const CtaInner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 3rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
`

const CtaTitle = styled.h2`
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 800;
`

const CtaText = styled.p`
  color: #cbd5e1;
  font-size: 0.9rem;
  line-height: 1.6;
  margin-top: 0.35rem;
`

const CtaActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`

const CtaPrimary = styled(Link)`
  border-radius: 999px;
  background-color: #fff;
  color: ${colors.navy};
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0.75rem 1.25rem;
`

const CtaWhatsApp = styled.a`
  border-radius: 999px;
  background-color: ${colors.successDark};
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0.75rem 1.25rem;
`

function fotoLocal(destino) {
  const texto = String(destino ?? '').toLowerCase()
  return texto.includes('macei') ? cardMaceio : cardCaldas
}

function fotoDoPacote(excursao) {
  if (excursao?.imagem_url) return excursao.imagem_url
  return fotoLocal(excursao?.destino)
}

function fotoQuebrou(event, excursao) {
  if (event.currentTarget.dataset.fb !== '1') {
    event.currentTarget.dataset.fb = '1'
    event.currentTarget.src = fotoLocal(excursao?.destino)
  }
}

// Fotos e legendas do carrossel "Viva a experiência". A ordem é a mesma da
// galeria anterior, mas agora elas aparecem em um único bloco grande.
const GALERIA_HOME = [
  {
    src: fotoGrupoRua,
    alt: 'Grupo de clientes reunido antes da viagem',
    legenda: 'Novas amizades',
  },
  {
    src: fotoFamilia,
    alt: 'Família aproveitando a piscina do hotel',
    legenda: 'Hospedagem',
  },
  {
    src: fotoGrupoPiscina,
    alt: 'Clientes no parque aquático',
    legenda: 'Passeios',
  },
  {
    src: fotoOnibus,
    alt: 'Ônibus da viagem',
    legenda: 'Na estrada',
  },
  {
    src: fotoBingo,
    alt: 'Clientes participando de brincadeira a bordo',
    legenda: 'Momentos a bordo',
  },
  {
    src: fotoGrupoPlanta,
    alt: 'Clientes da IMF Turismo posando juntos',
    legenda: 'Turma IMF',
  },
]

function Home() {
  const numero = useWhatsApp()
  const [destaques, setDestaques] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [indiceGaleria, setIndiceGaleria] = useState(0)
  const [galeriaPausada, setGaleriaPausada] = useState(false)
  const mensagem = 'Olá! Vim pelo site da IMF Turismo e gostaria de saber mais sobre as excursões.'
  const mensagemIara = 'Olá, Iara! Vim pelo site da IMF Turismo e gostaria de falar com você.'

  // O carrossel avança sozinho a cada 5 segundos. Ao passar o mouse ou focar
  // nos controles, ele pausa para dar tempo de ler a legenda.
  useEffect(() => {
    if (galeriaPausada) return undefined
    const intervalo = window.setInterval(() => {
      setIndiceGaleria((atual) => (atual + 1) % GALERIA_HOME.length)
    }, 5000)
    return () => window.clearInterval(intervalo)
  }, [galeriaPausada])

  function moverGaleria(delta) {
    setIndiceGaleria(
      (atual) => (atual + delta + GALERIA_HOME.length) % GALERIA_HOME.length,
    )
  }

  useEffect(() => {
    let ativo = true

    async function carregar() {
      try {
        const resp = await api.get('/api/excursoes')
        if (!ativo) return

        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        const proximas = (resp.data ?? [])
          .filter((excursao) => Number(excursao.vagas_disponiveis) > 0)
          .filter((excursao) => {
            const data = new Date(`${excursao.data_ida}T00:00:00`)
            return !Number.isNaN(data.getTime()) && data >= hoje
          })
          .sort((a, b) => String(a.data_ida).localeCompare(String(b.data_ida)))
          .slice(0, 3)

        setDestaques(proximas)
      } catch {
        if (ativo) {
          setErro('Não foi possível carregar as próximas excursões agora. Fale com a equipe pelo WhatsApp.')
        }
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregar()
    return () => {
      ativo = false
    }
  }, [])

  return (
    <Page>
      <Hero>
        <HeroInner>
          <HeroText>
            <Eyebrow>IMF Turismo • Desde 2011</Eyebrow>
            <Title>
              Sua próxima viagem começa com um <TitleHighlight>atendimento individual</TitleHighlight>.
            </Title>
            <Subtitle>
              Excursões em grupo, hospedagem e suporte antes, durante e depois da viagem. Escolha o
              destino e deixe o resto com a IMF.
            </Subtitle>
            <Actions>
              <PrimaryAction to="/excursoes">Ver próximas excursões</PrimaryAction>
              <WhatsAppAction
                href={linkWhatsApp(numero, mensagem)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar no WhatsApp
              </WhatsAppAction>
            </Actions>
            <TrustList>
              <TrustItem>
                <TrustCheck aria-hidden="true">✓</TrustCheck> Atendimento individualizado
              </TrustItem>
              <TrustItem>
                <TrustCheck aria-hidden="true">✓</TrustCheck> Pós-venda diferenciado
              </TrustItem>
              <TrustItem>
                <TrustCheck aria-hidden="true">✓</TrustCheck> Suporte durante a viagem
              </TrustItem>
            </TrustList>
          </HeroText>

          <Collage>
            <CollageMain
              src={fotoGrupoLago}
              alt="Grupo de clientes da IMF Turismo em um banho relaxante com vista para o lago"
            />
            <CollageSmall src={fotoOnibus} alt="Ônibus de viagem da IMF Turismo" />
            <CollageSmall
              src={fotoGrupoPiscina}
              alt="Clientes se divertindo no parque aquático"
            />
          </Collage>
        </HeroInner>
      </Hero>

      <Section id="proximas">
        <SectionHeader>
          <div>
            <SectionTitle>Próximas excursões</SectionTitle>
            <SectionText>
              Confira as datas disponíveis, o valor por pessoa e as vagas restantes. As reservas
              são feitas pelo site e o pagamento é combinado com a equipe.
            </SectionText>
          </div>
          <SeeAll to="/excursoes">Ver todas as excursões →</SeeAll>
        </SectionHeader>

        {carregando && <Feedback>Carregando próximas excursões…</Feedback>}
        {!carregando && erro && <Feedback>{erro}</Feedback>}
        {!carregando && !erro && destaques.length === 0 && (
          <Feedback>
            Nenhuma excursão com vagas abertas no momento. Fale com a equipe para saber as próximas
            datas.
          </Feedback>
        )}
        {!carregando && !erro && destaques.length > 0 && (
          <CardsGrid>
            {destaques.map((excursao) => (
              <Card key={excursao.id_excursao}>
                <CardPhoto
                  src={fotoDoPacote(excursao)}
                  alt={excursao.destino}
                  loading="lazy"
                  onError={(event) => fotoQuebrou(event, excursao)}
                />
                <CardBody>
                  <CardTitle>{excursao.destino}</CardTitle>
                  <CardMeta>
                    {formatarDataBR(excursao.data_ida)} a {formatarDataBR(excursao.data_volta)}
                  </CardMeta>
                  <CardBottom>
                    <div>
                      <CardPrice>{formatarMoeda(excursao.valor_pessoa)}</CardPrice>
                      <Vacancies>
                        {excursao.vagas_disponiveis}{' '}
                        {Number(excursao.vagas_disponiveis) === 1 ? 'vaga' : 'vagas'}
                      </Vacancies>
                    </div>
                    <CardLink to={`/excursoes/${excursao.id_excursao}`}>Ver detalhes</CardLink>
                  </CardBottom>
                </CardBody>
              </Card>
            ))}
            {destaques.length < 3 && (
              <CtaCard $span={destaques.length === 1}>
                <CtaCardEyebrow>Fale com a equipe</CtaCardEyebrow>
                <CtaCardTitle>Não encontrou o destino que procura?</CtaCardTitle>
                <CtaCardText>
                  Conte para a IMF quando e como você quer viajar. A equipe ajuda a encontrar a
                  melhor opção para o seu grupo.
                </CtaCardText>
                <CtaCardLink
                  href={linkWhatsApp(numero, mensagem)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Conversar no WhatsApp
                </CtaCardLink>
              </CtaCard>
            )}
          </CardsGrid>
        )}
      </Section>

      <ExperienceSection>
        <ExperienceInner>
          <SectionHeader>
            <div>
              <SectionTitle>Viva a experiência</SectionTitle>
              <SectionText>
                Momentos reais de quem já viajou com a IMF. Do embarque ao retorno, o cuidado é o
                mesmo.
              </SectionText>
            </div>
          </SectionHeader>
          <Carousel
            aria-roledescription="carrossel"
            aria-label="Momentos da IMF Turismo"
            onMouseEnter={() => setGaleriaPausada(true)}
            onMouseLeave={() => setGaleriaPausada(false)}
            onFocus={() => setGaleriaPausada(true)}
            onBlur={() => setGaleriaPausada(false)}
          >
            <CarouselViewport>
              <CarouselTrack $indice={indiceGaleria}>
                {GALERIA_HOME.map((foto, indice) => (
                  <CarouselSlide
                    key={foto.legenda}
                    aria-hidden={indice !== indiceGaleria}
                  >
                    <CarouselPhoto
                      src={foto.src}
                      alt={foto.alt}
                      loading={indice === 0 ? 'eager' : 'lazy'}
                    />
                    <CarouselCaption>{foto.legenda}</CarouselCaption>
                  </CarouselSlide>
                ))}
              </CarouselTrack>
            </CarouselViewport>

            <CarouselButton
              type="button"
              $lado="esquerda"
              onClick={() => moverGaleria(-1)}
              aria-label="Foto anterior"
            >
              ‹
            </CarouselButton>
            <CarouselButton
              type="button"
              $lado="direita"
              onClick={() => moverGaleria(1)}
              aria-label="Próxima foto"
            >
              ›
            </CarouselButton>

            <CarouselDots role="group" aria-label="Escolher foto do carrossel">
              {GALERIA_HOME.map((foto, indice) => (
                <CarouselDot
                  key={foto.legenda}
                  type="button"
                  $ativo={indice === indiceGaleria}
                  aria-label={`Ver ${foto.legenda}`}
                  aria-current={indice === indiceGaleria}
                  onClick={() => setIndiceGaleria(indice)}
                />
              ))}
            </CarouselDots>
          </Carousel>
        </ExperienceInner>
      </ExperienceSection>

      <Section>
        <OwnerCard>
          <OwnerPhoto src={fotoIara} alt="Iara Maria Ferreira, fundadora da IMF Turismo" loading="lazy" />
          <OwnerContent>
            <Eyebrow>Quem cuida da sua viagem</Eyebrow>
            <OwnerTitle>IMF são as iniciais de Iara Maria Ferreira.</OwnerTitle>
            <Paragraph>
              A empresa nasceu em 2011, quando Iara buscou um pacote de viagem e acabou assumindo a
              organização. Desde então, ela se especializou, construiu uma rede de contatos e hoje
              conduz excursões para Caldas Novas e o Nordeste.
            </Paragraph>
            <Paragraph>
              Como guia de turismo com Cadastur, Iara acompanha cada grupo de perto — do primeiro
              contato ao retorno. É esse cuidado que faz o atendimento da IMF ser individual de
              verdade.
            </Paragraph>
            <Credentials>
              Iara Maria Ferreira — Fundadora e Guia de Turismo
              <br />
              Cadastur 07.949745.53-5
            </Credentials>
            <OwnerActions>
              <WhatsAppAction
                href={linkWhatsApp(numero, mensagemIara)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar com Iara
              </WhatsAppAction>
              <SecondaryAction to="/sobre">Conheça a IMF</SecondaryAction>
            </OwnerActions>
          </OwnerContent>
        </OwnerCard>
      </Section>

      <Section>
        <SectionHeader>
          <div>
            <SectionTitle>Por que viajar com a IMF?</SectionTitle>
            <SectionText>
              Um jeito de atender que acompanha o cliente do primeiro contato ao retorno.
            </SectionText>
          </div>
        </SectionHeader>
        <BenefitsGrid>
          <BenefitCard>
            <BenefitNumber>01</BenefitNumber>
            <BenefitTitle>Atendimento individualizado</BenefitTitle>
            <BenefitText>
              Cada cliente é atendido de acordo com seu tempo, suas necessidades e seu jeito de
              viajar.
            </BenefitText>
          </BenefitCard>
          <BenefitCard>
            <BenefitNumber>02</BenefitNumber>
            <BenefitTitle>Pós-venda diferenciado</BenefitTitle>
            <BenefitText>
              Assistência também quando você é impedido de viajar na data prevista.
            </BenefitText>
          </BenefitCard>
          <BenefitCard>
            <BenefitNumber>03</BenefitNumber>
            <BenefitTitle>Suporte antes, durante e depois</BenefitTitle>
            <BenefitText>
              A equipe acompanha a escolha do destino, a reserva e o suporte durante a viagem.
            </BenefitText>
          </BenefitCard>
          <BenefitCard>
            <BenefitNumber>04</BenefitNumber>
            <BenefitTitle>Transparência nas condições</BenefitTitle>
            <BenefitText>
              As formas de pagamento e as condições do pacote são combinadas diretamente com a
              equipe.
            </BenefitText>
          </BenefitCard>
        </BenefitsGrid>
      </Section>

      <HowSection>
        <HowInner>
          <SectionHeader>
            <div>
              <SectionTitle>Como funciona</SectionTitle>
              <SectionText>Três passos simples para começar a organizar sua viagem.</SectionText>
            </div>
          </SectionHeader>
          <Steps>
            <Step>
              <StepNumber>1</StepNumber>
              <StepTitle>Escolha seu pacote</StepTitle>
              <StepText>
                Veja as excursões disponíveis, confira datas, valores e vagas e escolha o destino.
              </StepText>
            </Step>
            <Step>
              <StepNumber>2</StepNumber>
              <StepTitle>Faça sua reserva</StepTitle>
              <StepText>
                Entre na sua conta, informe a quantidade de pessoas e confirme a reserva pelo site.
              </StepText>
            </Step>
            <Step>
              <StepNumber>3</StepNumber>
              <StepTitle>Combine o pagamento</StepTitle>
              <StepText>
                A equipe entra em contato pelo WhatsApp para combinar as formas de pagamento e o
                parcelamento.
              </StepText>
            </Step>
          </Steps>
        </HowInner>
      </HowSection>

      <Section>
        <SectionHeader>
          <div>
            <SectionTitle>Dúvidas frequentes</SectionTitle>
            <SectionText>As perguntas que mais aparecem antes de fechar a reserva.</SectionText>
          </div>
        </SectionHeader>
        <FaqList>
          <FaqItem>
            <FaqQuestion>O parcelamento no cartão é sem juros?</FaqQuestion>
            <FaqAnswer>
              O cartão é uma das formas de pagamento, mas as condições variam conforme o pacote e a
              data da viagem. A equipe confirma a quantidade de parcelas e se há juros pelo WhatsApp
              antes de fechar a reserva.
            </FaqAnswer>
          </FaqItem>
          <FaqItem>
            <FaqQuestion>Como são os hotéis e a disposição dos quartos?</FaqQuestion>
            <FaqAnswer>
              A hospedagem varia conforme o pacote. Na página de cada excursão aparecem as
              informações disponíveis. Para saber o porte do hotel, a categoria e a disposição dos
              quartos, fale com a equipe.
            </FaqAnswer>
          </FaqItem>
          <FaqItem>
            <FaqQuestion>Posso cancelar minha reserva?</FaqQuestion>
            <FaqAnswer>
              Sim. O cancelamento automático pode ser feito em Minhas Reservas até o prazo definido
              para cada pacote. Depois desse prazo, fale com a equipe pelo WhatsApp para avaliar as
              opções de reembolso ou crédito.
            </FaqAnswer>
          </FaqItem>
        </FaqList>
        <FaqLink to="/perguntas-frequentes">Ver todas as perguntas frequentes →</FaqLink>
      </Section>

      <Cta>
        <CtaInner>
          <div>
            <CtaTitle>{TAGLINE}</CtaTitle>
            <CtaText>
              Atendimento {HORARIO_ATENDIMENTO.toLowerCase()} • {EMAIL_CONTATO}
            </CtaText>
          </div>
          <CtaActions>
            <CtaPrimary to="/excursoes">Ver excursões</CtaPrimary>
            <CtaWhatsApp
              href={linkWhatsApp(numero, mensagem)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Falar no WhatsApp
            </CtaWhatsApp>
          </CtaActions>
        </CtaInner>
      </Cta>
    </Page>
  )
}

export default Home

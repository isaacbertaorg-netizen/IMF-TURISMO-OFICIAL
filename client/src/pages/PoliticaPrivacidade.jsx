// ===========================================================================
// IMF TURISMO — Política de Privacidade e Termos de Uso (LGPD)
// Texto-modelo v1.0. A IMF Turismo deve revisar o conteúdo com um profissional
// jurídico antes de considerá-lo definitivo. A versão aqui exibida precisa
// coincidir com VERSAO_POLITICA_PRIVACIDADE no back-end.
// ===========================================================================

import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { colors } from '../theme.js'

const Page = styled.main`
  max-width: 820px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
`

const Title = styled.h1`
  color: ${colors.navy};
  font-weight: 800;
  font-size: 2rem;
  margin-bottom: 0.35rem;
`

const Version = styled.p`
  color: ${colors.textMuted};
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
`

const Card = styled.article`
  background-color: ${colors.background};
  border-radius: 1rem;
  box-shadow: 0 8px 24px rgb(15 45 82 / 0.08);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`

const Subtitle = styled.h2`
  color: ${colors.navy};
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0.4rem 0 0;
`

const Paragraph = styled.p`
  color: ${colors.navy};
  font-size: 0.92rem;
  line-height: 1.6;
  margin: 0;
`

const List = styled.ul`
  color: ${colors.navy};
  font-size: 0.92rem;
  line-height: 1.6;
  margin: 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`

const Back = styled(Link)`
  display: inline-block;
  margin-top: 1.25rem;
  color: ${colors.primary};
  font-weight: 600;
`

const Strong = styled.strong`
  color: ${colors.navy};
`

function PoliticaPrivacidade() {
  return (
    <Page>
      <Title>Política de Privacidade e Termos de Uso</Title>
      <Version>Versão 1.0 — atualizada em 24/10/2026.</Version>

      <Card>
        <Paragraph>
          A <Strong>IMF Turismo</Strong> trata dados pessoais de clientes e passageiros para
          viabilizar o cadastro, as reservas e o atendimento. Esta página explica quais dados são
          coletados, para que são usados, com quem podem ser compartilhados e como você pode exercer
          os direitos previstos na Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
        </Paragraph>

        <Subtitle>1. Quem somos</Subtitle>
        <Paragraph>
          A IMF Turismo é a controladora dos dados pessoais coletados neste site. O canal para
          assuntos de privacidade e proteção de dados é o e-mail{' '}
          <Strong>imfturismooficial@gmail.com</Strong>. Você também pode falar com a equipe pelo
          WhatsApp divulgado na página inicial.
        </Paragraph>

        <Subtitle>2. Dados que coletamos</Subtitle>
        <List>
          <li>
            <Strong>Cadastro:</Strong> nome, CPF, e-mail, telefone e endereço.
          </li>
          <li>
            <Strong>Reservas:</Strong> excursão escolhida, quantidade de vagas, status e os dados
            dos passageiros (nome, CPF e data de nascimento).
          </li>
          <li>
            <Strong>Foto de perfil (opcional):</Strong> imagem enviada por você para aparecer no
            avatar do site.
          </li>
          <li>
            <Strong>Consentimentos:</Strong> aceite da política, autorizações opcionais e as datas
            em que foram concedidas ou revogadas.
          </li>
          <li>
            <Strong>Registros técnicos:</Strong> informações necessárias para segurança, como data
            e hora de acesso e endereço IP, quando gerados pelos serviços de hospedagem.
          </li>
        </List>
        <Paragraph>
          O site não armazena dados de cartão de crédito. O pagamento é combinado diretamente com a
          IMF Turismo pelo WhatsApp, fora da plataforma.
        </Paragraph>

        <Subtitle>3. Finalidades e bases legais</Subtitle>
        <List>
          <li>
            <Strong>Cadastro e reservas:</Strong> execução de contrato e procedimentos preliminares
            (art. 7º, V, da LGPD).
          </li>
          <li>
            <Strong>Obrigações legais e fiscais:</Strong> cumprimento de obrigação legal ou
            regulatória (art. 7º, II).
          </li>
          <li>
            <Strong>Segurança e prevenção a fraudes:</Strong> legítimo interesse (art. 7º, IX), com
            medidas para não afetar seus direitos e liberdades.
          </li>
          <li>
            <Strong>Uso da imagem e comunicações de marketing:</Strong> consentimento (art. 7º, I),
            que pode ser revogado a qualquer momento.
          </li>
          <li>
            <Strong>Compartilhamento com fornecedores da viagem:</Strong> execução do contrato e,
            quando aplicável, consentimento específico.
          </li>
        </List>

        <Subtitle>4. Uso da imagem</Subtitle>
        <Paragraph>
          A foto de perfil é opcional e serve para identificar você no site (avatar). Ela fica
          armazenada em um bucket público do Supabase com nome de arquivo aleatório; por isso,
          qualquer pessoa que tenha a URL pode acessá-la, embora o link não seja divulgado. Você pode
          trocar ou remover a foto a qualquer momento na página de Perfil.
        </Paragraph>
        <Paragraph>
          O uso da sua imagem em publicações do site e das redes sociais depende de uma autorização
          separada, marcada por você no Perfil. Essa autorização é opcional e pode ser revogada sem
          prejuízo ao uso da plataforma. Fotos de menores de 18 anos só podem ser usadas com a
          autorização do responsável legal.
        </Paragraph>

        <Subtitle>5. Compartilhamento</Subtitle>
        <Paragraph>
          Os dados necessários podem ser compartilhados com fornecedores que viabilizam a viagem
          (por exemplo, transporte, hospedagem e receptivo), com prestadores de tecnologia que
          hospedam o site e o banco de dados, e com autoridades quando houver obrigação legal. Não
          vendemos dados pessoais.
        </Paragraph>

        <Subtitle>6. Cookies e armazenamento local</Subtitle>
        <Paragraph>
          O site usa o armazenamento local do navegador para manter sua sessão autenticada (token de
          acesso) e a foto do avatar. Não usamos cookies de publicidade nem rastreadores de
          terceiros para perfilamento. Você pode limpar esses dados pelo navegador, o que encerra a
          sessão.
        </Paragraph>

        <Subtitle>7. Por quanto tempo guardamos</Subtitle>
        <Paragraph>
          Os dados de cadastro são mantidos enquanto a conta estiver ativa. Registros de reservas e
          pagamentos podem ser conservados pelo prazo necessário ao cumprimento de obrigações
          legais, fiscais e de defesa em processos. Os registros de consentimento são mantidos para
          comprovar o aceite e a revogação. Depois desses prazos, os dados são eliminados ou
          anonimizados.
        </Paragraph>

        <Subtitle>8. Seus direitos</Subtitle>
        <Paragraph>Nos termos do art. 18 da LGPD, você pode solicitar:</Paragraph>
        <List>
          <li>confirmação da existência de tratamento e acesso aos dados;</li>
          <li>correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
          <li>portabilidade, observados os segredos comercial e industrial;</li>
          <li>eliminação dos dados tratados com consentimento, ressalvadas as hipóteses legais;</li>
          <li>informação sobre compartilhamentos;</li>
          <li>revogação do consentimento, a qualquer momento.</li>
        </List>
        <Paragraph>
          Para exercer esses direitos, envie um pedido para{' '}
          <Strong>imfturismooficial@gmail.com</Strong>. Podemos solicitar informações para confirmar sua
          identidade e evitar acesso indevido. Responderemos dentro dos prazos legais.
        </Paragraph>

        <Subtitle>9. Segurança</Subtitle>
        <Paragraph>
          Adotamos medidas técnicas e administrativas para proteger os dados, como senhas
          armazenadas com hash, acesso restrito ao banco e às chaves de serviço, uso de HTTPS e
          controle de acesso por perfil. Nenhum sistema é totalmente imune a incidentes; caso ocorra
          um incidente relevante, comunicaremos os titulares e a Autoridade Nacional de Proteção de
          Dados conforme a lei.
        </Paragraph>

        <Subtitle>10. Crianças e adolescentes</Subtitle>
        <Paragraph>
          Quando a reserva incluir passageiro menor de 18 anos, o responsável legal deve declarar a
          autorização no fluxo de reserva. O tratamento dos dados do menor é limitado ao necessário
          para a viagem e é feito no melhor interesse da criança ou do adolescente (art. 14 da
          LGPD). Fotos de menores só são usadas com autorização do responsável.
        </Paragraph>

        <Subtitle>11. Alterações desta política</Subtitle>
        <Paragraph>
          Podemos atualizar esta política para refletir mudanças na lei ou nos serviços. A versão e a
          data ficam indicadas no topo da página. Quando a mudança afetar o aceite obrigatório, o
          site solicitará uma nova confirmação no Perfil.
        </Paragraph>

        <Subtitle>12. Termos de Uso</Subtitle>
        <List>
          <li>
            Você deve fornecer dados verdadeiros, completos e atualizados, e manter a
            confidencialidade da sua senha.
          </li>
          <li>
            A reserva é registrada como <Strong>pendente</Strong> até a confirmação do pagamento
            pela IMF Turismo. O pagamento e as condições da viagem são combinados pelo WhatsApp.
          </li>
          <li>
            Cancelamentos seguem o prazo informado na excursão. Reservas de excursões já iniciadas
            não são aceitas.
          </li>
          <li>
            É proibido usar o site para fins ilícitos, inserir conteúdo ofensivo ou tentar acessar
            áreas restritas.
          </li>
          <li>
            O conteúdo, a marca e as imagens da IMF Turismo não podem ser usados sem autorização.
          </li>
        </List>

        <Subtitle>13. Contato</Subtitle>
        <Paragraph>
          Dúvidas sobre privacidade, solicitações de titular ou assuntos dos Termos de Uso:{' '}
          <Strong>imfturismooficial@gmail.com</Strong>.
        </Paragraph>
      </Card>

      <Back to="/">Voltar à página inicial</Back>
    </Page>
  )
}

export default PoliticaPrivacidade

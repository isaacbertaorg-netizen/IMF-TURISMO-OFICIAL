ESPECIFICAÇÃO TÉCNICA E DIRETRIZES DE DESENVOLVIMENTO — IMF TURISMO
1. CONTEXTO E STACK TECNOLÓGICA
Você é o desenvolvedor principal deste projeto — o sistema web de gestão e planejamento de excursões da IMF Turismo, empresa que nasceu de forma orgânica organizando viagens em grupo para Caldas Novas (GO) e hoje expande para pacotes individuais e novos destinos no Nordeste. O problema central que este software resolve, segundo o próprio documento do projeto, é a substituição de um processo inteiramente manual (reservas, atendimento, controle de vagas feitos pela fundadora via mensagens) por um sistema que devolve tempo e escala ao negócio, sem perder o toque pessoal que é a marca da empresa até hoje. Esse espírito — organizado, mas caloroso — deve guiar tanto as decisões técnicas quanto as de interface. O projeto é o trabalho final do curso Técnico em Informática (CEMI-Gama), com entrega prevista para 30/10.
Front-end (client/): React, conforme já decidido pelo grupo. A escolha da abordagem de estilização será em Styled Components / Emotion e StyleX / Vanilla Extract — o que não pode mudar são os tokens de design definidos na seção 2, que são a fonte da verdade visual independentemente da ferramenta escolhida.
Back-end (server/): Python. O framework específico é FastAPI e Djang - escolha um que suporte validação de schema de entrada e integração simples com o Supabase, e documente a escolha aqui assim que definida.
Banco de Dados & Auth: Supabase (PostgreSQL + Supabase Auth + Supabase Storage). O schema base já foi definido em imf_turismo_schema.sql (tabelas cliente, administrador, excursao, reserva, passageiro, pagamento, comprovante), atendendo RF01–RF07 e ao mini mundo descrito na seção 4.1 do trabalho escrito.
Requisitos não funcionais que orientam toda a stack (RNF01–RNF07): resposta em até 3s, interface responsiva mobile/desktop, compatibilidade com Chrome/Firefox/Edge, backups periódicos, senhas nunca em texto puro, código modular e documentado para facilitar manutenção futura pela própria equipe ou por quem herdar o projeto depois da entrega.
Integrações futuras: gateway de pagamento (confirmação de reserva mediante pagamento) e emissão de comprovante único por transação.
⚠️ Nota de arquitetura sobre autenticação
O schema atual guarda senha_hash diretamente em cliente e administrador. Como o projeto usa Supabase Auth, a recomendação é não reinventar a autenticação: use auth.users (tabela nativa do Supabase Auth) para login/senha, e ligue cliente/administrador a ela via uma coluna id_auth_user UUID REFERENCES auth.users(id). Isso evita gerenciar hash de senha manualmente e usa os mecanismos de segurança prontos do Supabase (recuperação de senha, confirmação de e-mail, etc.). 

2. IDENTIDADE VISUAL E DESIGN SYSTEM
A logo é composta por três círculos entrelaçados (formato trevo/venn), cada um com um ícone: azul com avião (viagem), verde com globo (destinos/mundo), laranja com pino de localização (lugar específico). O nome "IMF Turismo" aparece em azul-marinho escuro, bold, tipografia arredondada e amigável.
Azul-marinho (texto de marca e títulos) — aprox. #0F2D52 Usado no logotype "IMF Turismo" e em todos os títulos de seção nas telas: "Confira nossos pacotes!", "Confirmar Reserva", "Cadastrar Nova Excursão", "Painel Administrativo". É a cor de maior peso visual do sistema — sempre bold, sempre o primeiro texto que o olho encontra na tela.
Azul de ação (botões primários) — aprox. #1E88E5 Usado nos botões sólidos "Entrar", "Criar conta" e "Ver detalhes", sempre em formato pílula (border-radius total, não apenas cantos arredondados) — visível nas Imagens 1, 2 e 3. Texto branco, bold.
Verde-esmeralda → verde-azulado, em gradiente (ação de destaque/positiva) — aprox. #22C55E → #0D9488 Este gradiente aparece em três lugares distintos do protótipo, não só em "sucesso": o botão "Confirmar Reserva" (Imagem 4), o botão "Salvar" no cadastro de excursão (Imagem 5) e os dois cards de totais do painel administrativo — "520 Total de reservas" e "185 Total de Clientes" (Imagem 6). Ou seja, no seu design esse gradiente significa "ação principal desta tela", não apenas confirmação — mantenha esse uso.
Verde de destaque de navegação (indicador de aba ativa) — mesma família do gradiente acima Nas Imagens 3 e 4, a aba ativa da navbar ("Perfil", "Minhas Reservas") tem um sublinhado verde — um detalhe sutil mas consistente: o azul marca ações, o verde marca "onde você está agora".
Laranja (do terceiro círculo da logo) — aprox. #F5871F Ainda não aparece em nenhuma tela do protótipo além da logo. Reserve-o como cor de destaque secundário (badges de promoção, "Novo", chips de aviso não-crítico) para não deixar essa cor da marca esquecida — mas não o use como cor funcional (isso já é papel do verde/vermelho).
Amarelo/dourado (avaliação por estrelas) — aprox. #FBBF24 Usado apenas na estrela de avaliação ao lado da nota (ex.: "★ 4.8"), Imagem 1.
Fundos:
Telas internas (listagem, reservas, painel admin): fundo branco/quase branco (#FFFFFF/#F9FAFB), bem neutro.
Telas de Login e Cadastro são a exceção: fundo de tela cheia com foto real de praia/mar (águas claras, coqueiros — Imagens 2 e 3), com o card de formulário branco flutuando por cima, centralizado. Esse contraste "foto de viagem ao fundo + card limpo na frente" é a identidade visual mais forte do protótipo e precisa ser preservado — não trocar por um fundo sólido.
Vermelho (erro/cancelamento) — #EF4444 Não aparece nos protótipos fornecidos, mas segue como padrão de mercado para ações destrutivas (cancelar reserva, excluir excursão, recusar) — mantenha reservado só para isso.
Texto secundário (datas, legendas, "Voltar à página inicial"): cinza-azulado neutro, aprox. #6B7280.
2.1. Como os componentes devem se comportar
Inputs (Login, Senha, Confirme sua senha, campos do cadastro de excursão): formato pílula (bordas totalmente arredondadas), fundo cinza bem claro (#F1F3F5 aprox.), sem borda visível em repouso, texto placeholder cinza médio. É um visual mais "app mobile moderno" do que "formulário de sistema corporativo" — mantenha essa leveza.
Botões primários (Entrar, Criar conta, Ver detalhes): pílula, azul de ação sólido, texto branco bold.
Botão de ação em destaque (Confirmar Reserva, Salvar): pílula, gradiente verde→verde-azulado, ligeiramente maior/mais chamativo que os botões azuis da mesma tela — é sempre o botão que fecha a etapa.
Botões destrutivos (Cancelar/Excluir/Recusar): vermelho sólido, sempre com confirmação em modal antes de executar.
Cards de excursão (Imagem 1): retângulo branco com cantos bem arredondados, foto do destino ocupando a lateral esquerda (não o topo inteiro), e à direita: nome do destino em azul-marinho bold, ícone de calendário verde + datas, ícone de cifrão em círculo azul + valor, estrela dourada + nota, tag cinza pequena "Adicionar aos favoritos", e o botão pílula azul "Ver detalhes" no canto inferior direito do bloco de texto.
Navbar: fundo branco, logo à esquerda, itens de menu (Início, Excursões, Minhas Reservas, Perfil) centralizados/à direita, avatar do usuário circular com seta de dropdown no canto direito. Item ativo ganha peso de fonte maior e sublinhado verde.
Sidebar administrativa (Imagens 5 e 6): fundo azul-marinho sólido (mesma cor da marca, não um azul diferente), ocupando toda a lateral esquerda em telas internas do admin. Itens em texto claro: "Painel Administrativo", "Excursões", "Clientes" (com seta > indicando submenu), "Reservas" (com seta >), "Sair" — sem ícones, só texto, hierarquia por espaçamento.
Cards de totais do painel (Imagem 6): dois blocos lado a lado, cantos arredondados, fundo em gradiente verde→verde-azulado, número grande e bold em branco, legenda pequena abaixo ("Total de reservas", "Total de Clientes") — são o primeiro elemento visual depois do título, reforçando que são a informação mais importante da tela.
Tabela de reservas recentes (Imagem 6): fundo branco simples, cabeçalho em cinza claro com colunas "Cliente | Destino | Vagas", linha por reserva, link "Ver detalhes" em azul ao final de cada linha — sem zebra striping nem bordas pesadas, visual limpo.
Responsividade (mobile-first, RNF01): os protótipos mostram um layout já pensado para tela larga tipo desktop/tablet (cards horizontais lado a lado); no mobile, os cards de excursão devem empilhar e os blocos foto+texto passam de lado-a-lado para foto-em-cima-texto-embaixo, mantendo os mesmos elementos (calendário, cifrão, estrela, botão pílula).

3. ESPECIFICAÇÃO COMPLETA DAS TELAS E FLUXOS DE NEGÓCIO
Regra de precedência: onde o protótipo visual e o texto do documento (RF/RNF/User Stories) divergirem, vale o texto do documento. Os protótipos foram feitos numa etapa inicial e podem estar incompletos ou desatualizados em relação à especificação funcional; use-os para linguagem visual (cores, formato de componentes, disposição), não como lista final de campos obrigatórios.’’’’’’’’’’’’’’’’’’’’
3.1. Tela Inicial / Listagem de Excursões (/)
Navbar branca fixa: logo "IMF Turismo" à esquerda; "Início", "Excursões", "Minhas Reservas", "Perfil" centralizados (item ativo com peso maior); avatar circular do usuário com seta de dropdown à direita (mostra "Entrar" se deslogado).
Título "Confira nossos pacotes!" em azul-marinho bold, grande, logo abaixo da navbar.
Cards de excursão empilhados verticalmente (RF02): foto do destino à esquerda, à direita nome do destino, período (ícone de calendário verde), valor (ícone de cifrão em círculo azul), avaliação (estrela dourada + nota), tag "Adicionar aos favoritos" e botão pílula azul "Ver detalhes".
Filtros: por destino, data e faixa de preço (RF02) — não aparecem no protótipo estático, mas são exigidos pelo RF02; posicionar acima da lista de cards, mantendo a mesma linguagem visual (inputs em pílula).
Consumo: GET /api/excursoes?destino=&data_inicio=&data_fim=&preco_min=&preco_max=.
3.2. Página de Detalhes da Excursão (/excursoes/:id)
Não há protótipo específico desta tela nos anexos — seguir a mesma linguagem visual dos cards (foto grande do destino, título azul-marinho) e exibir todos os atributos: destino, datas de ida/volta, valor por pessoa, descrição do roteiro, itens inclusos, vagas disponíveis.
Botão pílula azul "Reservar" → leva ao fluxo de reserva (exige login; se deslogado, redireciona para /login com retorno automático).
Consumo: GET /api/excursoes/:id.
3.3. Login (/login) e Cadastro (/cadastro) de Cliente
Fundo de tela cheia com foto de praia/mar (águas claras) em ambas as telas — não é uma cor sólida, é a assinatura visual dessas duas telas específicas.
Card branco centralizado, com a logo "IMF Turismo" no topo do card.
Login: campos "Login" e "Senha" em pílula, link "Esqueci minha senha" (texto azul-marinho bold, sem botão), botão pílula azul "Entrar". Autenticação via Supabase Auth. Sem link visível para cadastro no protótipo — adicionar um discreto ("Não tem conta? Cadastre-se") sem quebrar a limpeza da tela.
Cadastro: o protótipo mostra apenas "Login", "Senha" e "Confirme sua senha", mas o RF03 é explícito ao exigir nome completo, CPF, e-mail, telefone e endereço — o formulário real deve conter todos esses campos, não só os três do desenho. Estruture como um único formulário em card branco (mesma linguagem visual em pílula) com os campos adicionais acima dos de senha; se o card ficar longo demais para o layout centrado, divida em duas etapas (dados pessoais → login/senha) mantendo o mesmo estilo visual. Botão final pílula azul "Criar conta".
Validação de senhas idênticas no front-end e no back-end.
Após cadastro, criar automaticamente a linha em cliente vinculada ao auth.users recém-criado (trigger ou chamada explícita no back-end — nunca confiar apenas no front-end para essa gravação).
3.4. Fluxo de Reserva (/excursoes/:id/reservar)
Etapa 1: cliente autenticado escolhe quantidade de vagas.
Etapa 2: formulário com dados de cada passageiro (nome, CPF, data de nascimento) — RF04, um formulário por vaga selecionada.
Etapa 3 — tela "Confirmar Reserva" (Imagem 4): título azul-marinho bold; card branco com foto do destino à esquerda, nome do destino e período à direita, tag cinza "Ver pacote completo", valor em destaque (ex.: "R$179/diária"), contador "+ 2 pessoas -" para ajustar a quantidade de vagas direto na tela de confirmação, e o botão pílula em gradiente verde "Confirmar Reserva" no canto inferior direito do card. Abaixo do card, link de texto "Voltar à página inicial".
Ao confirmar: POST /api/reservas com id_excursao, qtd_vagas, lista de passageiros. Back-end valida vagas disponíveis (RF05) antes de gravar — nunca confiar apenas no trigger do banco, validar também na camada de aplicação para retornar erro amigável ao usuário.
Reserva criada com status = 'pendente' até confirmação de pagamento.
3.5. Minhas Reservas (/minhas-reservas)
Lista de reservas do cliente autenticado com status (pendente/confirmada/cancelada), data, destino.
Botão "Cancelar" disponível apenas se dentro do prazo definido pela excursão (prazo_cancelamento_dias, RF06) — desabilitar/ocultar o botão fora do prazo, mas o back-end deve validar de novo antes de aceitar o cancelamento.
Consumo: GET /api/reservas/minhas, PATCH /api/reservas/:id/cancelar.
3.6. Perfil do Cliente (/perfil)
Exibe e permite editar dados cadastrais (nome, telefone, endereço). CPF e e-mail não editáveis (chave de identificação).
3.7. Login Administrativo (/admin/login — Rota Oculta)
Sem link visível na navegação pública. E-mail + senha via Supabase Auth.
Após login, back-end verifica se o usuário tem registro em administrador (ou role = 'ADMIN') — se não tiver, nega acesso mesmo com login válido no Supabase.
3.8. Painel Administrativo (/admin/dashboard, Imagem 6)
Sidebar azul-marinho fixa à esquerda: "Painel Administrativo" (ativo), "Excursões", "Clientes >", "Reservas >", "Sair".
Título "Painel Administrativo" em azul-marinho bold.
Dois cards em gradiente verde lado a lado: número grande em branco + legenda ("520 / Total de reservas", "185 / Total de Clientes") — são os primeiros números que o administrador precisa ver ao abrir o sistema.
Tabela de reservas recentes: colunas "Cliente | Destino | Vagas", uma linha por reserva, link azul "Ver detalhes" ao final de cada linha, sem exibir status/ações de confirmar-recusar nesta tela — isso fica na tela dedicada de Reservas (3.10).
3.9. Gerenciamento de Excursões (/admin/excursoes)
Mesma sidebar azul-marinho, item "Excursões" ativo.
Listagem com ações Editar/Excluir (não há protótipo específico da listagem — seguir o mesmo padrão visual de tabela da Imagem 6, mas com colunas de excursão: nome, destino, período, vagas disponíveis/totais, valor).
Cadastrar Nova Excursão (/admin/excursoes/nova, Imagem 5): mesma sidebar, título "Cadastrar Nova Excursão" em azul-marinho bold. Formulário em card branco com campos pílula em cinza claro: "Nome da excursão", "Destino" (select/dropdown), e uma linha com os campos numéricos — "Preço" e "Número de Vagas". O protótipo mostra um único campo "Data", mas o RF01 exige data de saída e data de retorno — o formulário real deve ter dois campos de data ("Data de ida" e "Data de volta"), não um só. O RF01 também exige descrição do roteiro e itens inclusos, ausentes do protótipo — adicione um campo de texto/textarea para cada, mantendo o mesmo card. Botão pílula em gradiente verde "Salvar" ao final.
Upload de imagem da excursão para Supabase Storage — não aparece no protótipo, adicionar mantendo os cards pílula como padrão.
3.10. Gerenciamento de Reservas (/admin/reservas)
Mesma sidebar azul-marinho, item "Reservas" ativo (com submenu indicado pela seta >, ex.: talvez "Pendentes"/"Confirmadas"/"Canceladas" como subitens).
Filtros por status (Todas, Pendentes, Confirmadas, Canceladas) acima da tabela — mesmo padrão visual de tabela da Imagem 6.
Ação "Cancelar manualmente" (RF06, cancelamento pelo admin em situações excepcionais) — botão vermelho, exige modal de confirmação dupla antes de executar.
3.11. Gerenciamento de Clientes (/admin/clientes)
Lista de clientes cadastrados com dados de contato — somente leitura, sem exibir senha/hash nunca (nem existe, pois a senha vive no Supabase Auth).

4. METODOLOGIA TDD (TEST-DRIVEN DEVELOPMENT)
Todo módulo do back-end deve ter testes escritos antes ou junto da implementação da rota (pytest):
server/tests/test_excursoes.py:
Testar que uma excursão sem vagas_disponiveis suficiente rejeita a reserva (overbooking).
Testar filtros de listagem (destino, data, faixa de preço).
server/tests/test_reservas.py:
Testar criação de reserva com passageiros.
Testar cancelamento dentro e fora do prazo (prazo_cancelamento_dias).
Testar que vagas voltam a ficar disponíveis após cancelamento.
server/tests/test_auth.py:
Testar que rotas /api/admin/* retornam 403 para usuários sem role ADMIN.
Testar que rotas protegidas retornam 401 sem token válido.
Verificação periódica
Não avance etapas silenciosamente. Ao concluir um módulo (ex.: rotas de excursões, depois reservas, depois admin), pare e peça para eu revisar antes de seguir para o próximo. Rode a suíte de testes (pytest) e me mostre o resultado a cada checkpoint.
Se eu pedir "verifica tudo" ou similar, rode a suíte completa de testes e faça uma checagem manual de lint/tipos antes de reportar o status — não afirme que "está tudo certo" sem ter rodado nada.

5. ESTILO DE COMENTÁRIOS NO CÓDIGO
Comente em português, de forma objetiva e séria — sem tom brincalhão, gírias ou emojis. Ex.: # valida se há vagas suficientes antes de confirmar a reserva, evitando overbooking em vez de qualquer variação lúdica ("mágica", "aqui a festa acontece", etc.).
Todo bloco de lógica não-óbvia (validações, triggers, regras de negócio como o prazo de cancelamento) precisa de um comentário explicando o "porquê" da decisão, não só repetir o que o código já deixa claro por si.
Evite comentário redundante linha a linha (ex.: # soma 1 acima de total += 1); comente onde agrega entendimento, não onde só decora o código.

6. DIRETRIZES DE SEGURANÇA E BOAS PRÁTICAS
6.1. Proteção contra SQL Injection e Injeção de Dados
Nunca concatenar strings para montar SQL manualmente.
Use sempre o client parametrizado do Supabase (supabase.table("excursao").select("*").eq("destino", destino)) ou, se usar SQLAlchemy, sempre com queries parametrizadas/ORM — nunca f-string dentro de SQL cru.
Validar e sanitizar todo body/query params das rotas FastAPI usando Pydantic (schemas de request) antes de processar qualquer dado.
6.2. Controle de Acesso e Proteção de Rotas
Nenhuma rota /api/admin/* deve confiar no front-end. Toda rota administrativa passa por uma dependência FastAPI (Depends(get_current_admin)) que:
Extrai o Bearer Token do header Authorization.
Valida o token com o Supabase Auth (supabase.auth.get_user(token)).
Verifica se existe registro correspondente em administrador (ou role = 'ADMIN'). Caso contrário, retorna 403 Forbidden.
Mesmo padrão para rotas de cliente autenticado (Depends(get_current_cliente)), garantindo que um cliente só veja/edite as próprias reservas (id_cliente do token, nunca vindo do body da requisição).
Guarda de rotas no front-end: componente <ProtectedRoute /> no React Router. Tentativa de acessar /admin/dashboard ou /minhas-reservas sem sessão válida redireciona para /login (ou /admin/login) imediatamente.
6.3. Gestão de Variáveis de Ambiente e Segredos
Nunca expor SUPABASE_SERVICE_ROLE_KEY no front-end. O client/ usa apenas SUPABASE_ANON_KEY.
.env sempre no .gitignore. Apenas .env.example (sem valores reais) é versionado.
Mantenha um .gitignore completo (node_modules/, .env, __pycache__/, venv/, .venv/, dist/, .DS_Store) desde o primeiro commit.
6.4. XSS, CSRF e Headers de Segurança
Nunca usar dangerouslySetInnerHTML no React com dado vindo do usuário (ex.: repertório de músicas, descrição, endereço) sem sanitização.
No FastAPI, adicionar middleware de headers de segurança (ex.: secure ou headers manuais: X-Frame-Options, Content-Security-Policy, X-Content-Type-Options).
CORS restrito: CORSMiddleware do FastAPI configurado para aceitar apenas o domínio do front-end oficial (nunca allow_origins=["*"] em produção).
6.5. Rate Limiting
Aplicar slowapi (ou equivalente) nas rotas públicas sensíveis: POST /api/reservas, POST /api/cadastro, POST /api/login — evita spam e ataques de força bruta.
6.6. Overbooking e Integridade de Dados
A validação de vagas deve existir em duas camadas: trigger no PostgreSQL (já implementado em imf_turismo_schema.sql) e validação explícita no back-end antes de tentar o insert — nunca dependa só do banco para dar um retorno de erro amigável ao usuário.

7. FLUXO DE GIT E CONTROLE DE VERSÃO
Regra absoluta: nenhum push, em nenhuma hipótese, sem revisão explícita minha.
Todos os commits devem ser locais (git add + git commit). Nunca rode git push, git push origin, nem qualquer comando que sincronize com um repositório remoto (GitHub, GitLab, etc.) por conta própria.
Não crie, publique ou sincronize branches remotos automaticamente.
Escreva mensagens de commit claras e descritivas (padrão Conventional Commits: feat:, fix:, test:, chore:, docs:) para facilitar minha revisão do histórico local depois.
Mantenha o .gitignore sempre atualizado e correto localmente, mas não o publique junto de nenhum push — na prática, isso significa: nada vai para a nuvem até eu revisar e mandar explicitamente subir.
Ao final de cada checkpoint (ver seção 4), me avise que há commits locais prontos para revisão, mas não tome a iniciativa de publicá-los.

8. RESUMO RÁPIDO PARA O AGENTE
Sempre valide entrada com Pydantic, nunca confie no front-end.
Sempre proteja rotas administrativas e de cliente com verificação de token + role.
Sempre valide vagas disponíveis antes de criar reserva (dupla camada).
Sempre escreva teste antes/junto da rota (TDD) e rode a suíte nos checkpoints.
Sempre comente em português, de forma objetiva e séria, explicando o "porquê".
Nunca dê git push. Só commits locais. Aguarde revisão.
Nunca exponha SUPABASE_SERVICE_ROLE_KEY no front-end nem .env no repositório.


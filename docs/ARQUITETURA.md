# IMF Turismo — Decisões de Arquitetura

Documento de registro das escolhas técnicas do projeto, conforme exigido na
seção 1 do PRODUCT.md ("documente a escolha aqui assim que definida").

## Stack adotada

| Camada      | Tecnologia                                   | Justificativa (ver PRODUCT.md)                       |
| ----------- | -------------------------------------------- | ---------------------------------------------------- |
| Front-end   | React + Vite + Styled Components             | Já decidida pelo grupo; Vite como bundler moderno.   |
| Back-end    | Python + **FastAPI**                         | Escolhido pelo suporte a validação via Pydantic e integração simples com o Supabase (seções 6.1 e 6.4). |
| Banco/Auth  | Supabase (PostgreSQL + Auth + Storage)       | Schema base já definido em imf_turismo_schema.sql.   |
| Testes      | pytest (back-end)                            | Metodologia TDD (seção 4).                           |
| Rate limit  | slowapi (rotas públicas sensíveis)           | Prevenção de spam/força bruta (seção 6.5).           |

## Escolha do framework back-end: FastAPI

Optamos por **FastAPI** em vez de Django porque:

- **Validação de schema** nativa via Pydantic (seção 6.1): cada rota valida e
  sanitiza body/query params antes de processar, atendendo ao requisito de
  nunca confiar no front-end.
- **Integração direta com o Supabase**: o client oficial `supabase-py` usa
  queries parametrizadas (`supabase.table(...).select(...).eq(...)`), o que
  atende à regra anti SQL Injection (seção 6.1).
- **Dependências de autenticação** (`Depends(get_current_admin)`) permitem
  proteger rotas de forma declarativa (seção 6.2).
- **Assincronismo nativo** e resposta rápida, alinhado ao RNF01 (resposta em
  até 3s).

## Segurança aplicada

- Headers de segurança via middleware no `server/app/main.py` (seção 6.4).
- CORS restrito a origens configuradas por variável de ambiente (seção 6.4).
- `.env` nunca versionado; apenas `.env.example` sem valores (seção 6.3).
- Chave de serviço do Supabase restrita ao back-end (seção 6.3).

## Autenticação

> **Desvio documentado em relação à nota da seção 1 do PRODUCT.md.**
> A nota recomendava usar o Supabase Auth (`auth.users`) em vez de gerenciar
> senha. Porém o schema real (`imf_turismo_schema.sql`) armazena `senha_hash`
> diretamente em `cliente` e `administrador` e não possui coluna `id_auth_user`.
> Como as rotas devem se adequar a esse banco, a autenticação foi implementada
> com **bcrypt** para o hash das senhas e **JWT próprio** para a sessão
> (`app/core/security.py`). As dependências `get_current_cliente` /
> `get_current_admin` (`app/core/auth.py`) validam o JWT e o papel a cada rota.
>
> Se no futuro quiser migrar para o Supabase Auth, basta adicionar a coluna
> `id_auth_user UUID REFERENCES auth.users(id)` nas duas tabelas e trocar a
> camada de autenticação — o restante da API permanece.

## Superfície da API (rotas implementadas)

| Método | Rota                          | Acesso        | Descrição                                   |
| ------ | ----------------------------- | ------------- | ------------------------------------------- |
| GET    | `/api/health`                 | Público       | Healthcheck do serviço                      |
| POST   | `/api/login`                  | Público (RL)  | Login de cliente (e-mail + senha_hash), JWT |
| POST   | `/api/admin/login`            | Público (RL)  | Login de administrador (rota oculta, 3.7)   |
| POST   | `/api/cadastro`               | Público (RL)  | Cria cliente com senha hasheada             |
| GET    | `/api/excursoes`              | Público       | Listagem com filtros (RF02)                 |
| GET    | `/api/excursoes/{id}`         | Público       | Detalhes da excursão                        |
| POST   | `/api/reservas`               | Cliente (RL)  | Cria reserva com passageiros (RF04)         |
| GET    | `/api/reservas/minhas`        | Cliente       | Reservas do cliente autenticado             |
| PATCH  | `/api/reservas/{id}/cancelar` | Cliente       | Cancelamento respeitando prazo (RF06)       |
| GET    | `/api/admin/dashboard`        | ADMIN         | Totais do painel                            |
| CRUD   | `/api/admin/excursoes`        | ADMIN         | Gerenciamento de excursões (RF01)           |
| GET    | `/api/admin/reservas`         | ADMIN         | Reservas com filtro por status              |
| PATCH  | `/api/admin/reservas/{id}/cancelar` | ADMIN   | Cancelamento manual (RF06)                  |
| GET    | `/api/admin/clientes`         | ADMIN         | Clientes (somente leitura)                  |

(RL = rate limited via slowapi, seção 6.5)

## Estrutura do back-end

- `app/schemas/` — validação Pydantic de toda entrada (seção 6.1).
- `app/services/` — regras de negócio (validação de vagas, prazo de
  cancelamento) testáveis isoladamente.
- `app/routes/` — rotas HTTP (validação + autenticação + rate limit).
- `app/core/` — client Supabase, autenticação/JWT, rate limit e exceções de domínio.
- `tests/` — suíte pytest com um **Supabase fake em memória** (conftest) que
  simula os triggers de vagas do banco, permitindo TDD sem credenciais reais.

## Nota sobre o schema

O back-end foi validado contra o schema real do Supabase (as 7 tabelas e
todas as colunas foram confirmadas por conexão em 30/08/2026). As consultas
usam os nomes reais das colunas:

- `cliente`: `id_cliente`, `nome_cliente`, `cpf`, `email`, `telefone`,
  `endereco`, `senha_hash`, `data_cadastro`.
- `administrador`: `id_admin`, `nome_admin`, `login_admin`, `senha_admin`.
- `excursao`: `id_excursao`, `id_admin`, `nome_excursao`, `destino`,
  `data_ida`, `data_volta`, `vagas_totais`, `vagas_disponiveis`,
  `valor_pessoa`, `descricao_roteiro`, `itens_inclusos`,
  `prazo_cancelamento_dias`.
- `reserva`: `id_reserva`, `id_cliente`, `id_excursao`, `qtd_vagas`,
  `data_reserva`, `status` (enum).
- `passageiro`: `id_passageiro`, `id_reserva`, `nome_passageiro`, `cpf`,
  `data_nascimento`.

O schema usa triggers (`fn_atualizar_vagas` / `fn_checar_vagas`) para manter
`vagas_disponiveis` sincronizadas. Por isso os serviços **não** ajustam as
vagas manualmente — apenas validam o overbooking na camada de aplicação
(seção 6.6) e alteram o status da reserva, deixando o trigger atualizar o
estoque (evita dupla contagem). O fake dos testes simula esses triggers.

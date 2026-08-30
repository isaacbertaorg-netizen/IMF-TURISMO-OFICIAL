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

A autenticação usa o **Supabase Auth** nativo (`auth.users`) em vez de
gerenciar hash de senha manualmente, conforme a nota de arquitetura da seção 1.
`cliente` e `administrador` se ligam a `auth.users` via uma coluna
`id_auth_user`. O back-end cria o vínculo em `cliente` no cadastro (nunca
confiando apenas no front-end) e as dependências `get_current_cliente` /
`get_current_admin` (`app/core/auth.py`) validam token + vínculo em cada rota
protegida.

## Superfície da API (rotas implementadas)

| Método | Rota                          | Acesso        | Descrição                                   |
| ------ | ----------------------------- | ------------- | ------------------------------------------- |
| GET    | `/api/health`                 | Público       | Healthcheck do serviço                      |
| POST   | `/api/login`                  | Público (RL)  | Login via Supabase Auth, retorna token      |
| POST   | `/api/cadastro`               | Público (RL)  | Cria auth.user + linha em `cliente`         |
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
- `app/core/` — client Supabase, autenticação, rate limit e exceções de domínio.
- `tests/` — suíte pytest com um **Supabase fake em memória** (conftest),
  permitindo TDD sem credenciais reais.

## Nota sobre o schema

O arquivo `imf_turismo_schema.sql` não está versionado no repositório. As
consultas usam os nomes descritos no PRODUCT.md (`cliente`, `administrador`,
`excursao`, `reserva`, `passageiro`), com colunas como `id_auth_user`,
`vagas_disponiveis`, `prazo_cancelamento_dias`, `status`, `data_saida` e
`data_retorno`. Caso o schema real difira, os serviços em `app/services/`
concentram os nomes de coluna para ajuste pontual.

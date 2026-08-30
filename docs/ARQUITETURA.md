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

A autenticação usará o **Supabase Auth** nativo (`auth.users`) em vez de
gerenciar hash de senha manualmente, conforme a nota de arquitetura da seção 1.
`cliente` e `administrador` se ligam a `auth.users` via uma coluna
`id_auth_user` (a implementação entra nos próximos checkpoints).

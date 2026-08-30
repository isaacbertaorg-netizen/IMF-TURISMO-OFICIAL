# IMF Turismo — Back-end (server/)

API em Python/FastAPI integrada ao Supabase. Estrutura TDD (seção 4 do PRODUCT.md).

## Estrutura

```
server/
├── app/
│   ├── main.py              # App FastAPI: routers, CORS, headers de segurança, rate limit
│   ├── config.py            # Leitura das variáveis de ambiente (python-dotenv)
│   ├── core/                # Componentes transversais
│   │   ├── supabase.py      # Client do Supabase (lazy, com chave de serviço)
│   │   ├── auth.py          # Dependências get_current_cliente / get_current_admin
│   │   ├── rate_limit.py    # Limiter do slowapi
│   │   └── exceptions.py    # Exceções de domínio + handlers HTTP
│   ├── schemas/             # Validação Pydantic de toda entrada (seção 6.1)
│   │   ├── auth.py          # Login / token
│   │   ├── cliente.py       # Cadastro (RF03)
│   │   ├── excursao.py      # Criação/edição de excursão (RF01)
│   │   └── reserva.py       # Reserva + passageiros (RF04)
│   ├── services/            # Regras de negócio (testáveis isoladamente)
│   │   ├── auth_service.py
│   │   ├── excursao_service.py
│   │   ├── reserva_service.py
│   │   └── admin_service.py
│   └── routes/              # Rotas HTTP
│       ├── health.py        # GET /api/health
│       ├── auth.py          # POST /api/login, POST /api/cadastro
│       ├── excursoes.py     # GET /api/excursoes[/{id}]
│       ├── reservas.py      # POST/GET/PATCH /api/reservas...
│       └── admin.py         # /api/admin/*
├── tests/                   # Suíte pytest (conftest com Supabase fake em memória)
│   ├── conftest.py
│   ├── test_health.py
│   ├── test_excursoes.py
│   ├── test_reservas.py
│   ├── test_auth.py
│   └── test_admin.py
├── requirements.txt
├── pytest.ini
└── pyproject.toml           # Config do ruff (lint/format)
```

## Preparação do ambiente

```powershell
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

## Variáveis de ambiente

Copie `.env.example` (raiz) para `server/.env` e preencha com os valores reais:

- `SUPABASE_URL` — URL do projeto.
- `SUPABASE_SERVICE_ROLE_KEY` — chave de serviço (somente back-end).
- `SUPABASE_ANON_KEY` — chave anônima.
- `JWT_SECRET` — segredo para assinar os tokens de sessão (opcional; se vazio,
  usa a chave de serviço). Recomenda-se um valor próprio em produção.

Nunca versione o `.env` (seção 6.3 do PRODUCT.md).

## Executar a suíte de testes

```powershell
.\.venv\Scripts\python.exe -m pytest -v
```

Os testes usam um **Supabase fake em memória** (`tests/conftest.py`) — não precisam
de credenciais reais nem de conexão com a internet.

## Lint e formatação (ruff)

```powershell
.\.venv\Scripts\ruff.exe check app tests
.\.venv\Scripts\ruff.exe format app tests
```

## Rodar o servidor em desenvolvimento

```powershell
.\.venv\Scripts\uvicorn.exe app.main:app --reload
```

Healthcheck: `GET http://localhost:8000/api/health`
Documentação interativa: `http://localhost:8000/docs`

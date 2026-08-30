# IMF Turismo — Back-end (server/)

API em Python/FastAPI integrada ao Supabase. Estrutura TDD (seção 4 do PRODUCT.md).

## Estrutura

```
server/
├── app/
│   ├── __init__.py
│   ├── main.py      # App FastAPI, healthcheck e headers de segurança
│   └── config.py    # Leitura das variáveis de ambiente (python-dotenv)
├── tests/
│   └── test_health.py  # Teste do healthcheck (TDD)
├── requirements.txt
└── pytest.ini
```

## Preparação do ambiente

```powershell
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

## Executar a suíte de testes

```powershell
.\.venv\Scripts\python.exe -m pytest -v
```

## Rodar o servidor em desenvolvimento

```powershell
.\.venv\Scripts\uvicorn.exe app.main:app --reload
```

Healthcheck: `GET http://localhost:8000/api/health`

## Variáveis de ambiente

Copie o `.env.example` da raiz para `.env` e preencha com os valores reais.
Nunca versione o `.env` (seção 6.3 do PRODUCT.md).

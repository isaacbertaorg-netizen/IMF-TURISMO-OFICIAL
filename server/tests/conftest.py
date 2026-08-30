# ===========================================================================
# IMF TURISMO — fixtures compartilhadas dos testes
# Substitui o client do Supabase por um fake em memória que reproduz a API
# fluente usada pelos serviços (table().select().eq()...) e simula os
# triggers do schema real (decremento/incremento de vagas em reserva).
# Permite rodar a suíte sem credenciais reais e com dados determinísticos.
# ===========================================================================

import re

import pytest
from fastapi.testclient import TestClient

from app.core import supabase as supabase_module
from app.core.rate_limit import limiter
from app.core.security import criar_token
from app.main import app

# Chave primária de cada tabela (nomes reais do schema).
PRIMARY_KEYS = {
    "administrador": "id_admin",
    "cliente": "id_cliente",
    "excursao": "id_excursao",
    "reserva": "id_reserva",
    "passageiro": "id_passageiro",
    "pagamento": "id_pagamento",
    "comprovante": "id_comprovante",
}

# Colunas UNIQUE do schema (usadas para simular violação de unicidade).
UNIQUE_CONSTRAINTS = {
    "cliente": ["cpf", "email"],
    "administrador": ["login_admin"],
}


class FakeResult:
    def __init__(self, data):
        self.data = data


class FakeQuery:
    """Query fluente com suporte a filtros, ordenação, update e delete."""

    def __init__(self, fake, table_name, underlying):
        self._fake = fake
        self._table = table_name
        # `underlying` é a LISTA REAL da tabela (referência), para que update
        # e delete persistam as mudanças no estado do fake.
        self._underlying = underlying
        self._predicates = []
        self._columns = None
        self._order_col = None
        self._order_desc = False
        self._limit = None
        self._pending_update = None
        self._pending_delete = False
        self._single = False

    def select(self, *cols):
        # Projeção de colunas: o Supabase retorna apenas as colunas pedidas.
        # PostgREST aceita colunas separadas por vírgula em uma única string.
        if cols and cols != ("*",):
            colunas = []
            for c in cols:
                colunas.extend([p.strip() for p in c.split(",") if p.strip()])
            self._columns = tuple(colunas) if colunas else None
        return self

    def eq(self, col, val):
        self._predicates.append(lambda r, c=col, v=val: r.get(c) == v)
        return self

    def neq(self, col, val):
        self._predicates.append(lambda r, c=col, v=val: r.get(c) != v)
        return self

    def gt(self, col, val):
        self._predicates.append(lambda r, c=col, v=val: r.get(c) > v)
        return self

    def gte(self, col, val):
        self._predicates.append(lambda r, c=col, v=val: r.get(c) >= v)
        return self

    def lt(self, col, val):
        self._predicates.append(lambda r, c=col, v=val: r.get(c) < v)
        return self

    def lte(self, col, val):
        self._predicates.append(lambda r, c=col, v=val: r.get(c) <= v)
        return self

    def in_(self, col, values):
        self._predicates.append(lambda r, c=col, v=values: r.get(c) in v)
        return self

    def ilike(self, col, pattern):
        # ilike do Supabase é busca case-insensitive com curinga %.
        regex = re.compile("^" + pattern.replace("%", ".*") + "$", re.IGNORECASE)
        self._predicates.append(lambda r, c=col, rx=regex: rx.match(str(r.get(c, ""))) is not None)
        return self

    def order(self, col, desc=False):
        self._order_col = col
        self._order_desc = desc
        return self

    def limit(self, n):
        self._limit = n
        return self

    def maybe_single(self):
        self._single = True
        return self

    def single(self):
        self._single = True
        return self

    def _matched(self):
        return [r for r in self._underlying if all(p(r) for p in self._predicates)]

    def execute(self):
        linhas = self._matched()
        if self._order_col:
            linhas = sorted(linhas, key=lambda r: r.get(self._order_col), reverse=self._order_desc)
        if self._limit:
            linhas = linhas[: self._limit]

        if self._pending_update is not None:
            # Simula o trigger fn_atualizar_vagas ao cancelar uma reserva.
            if self._table == "reserva" and self._pending_update.get("status") == "cancelada":
                self._fake._estornar_vagas(linhas)
            for r in linhas:
                r.update(self._pending_update)
            return FakeResult(linhas)

        if self._pending_delete:
            for r in linhas:
                self._underlying.remove(r)
            return FakeResult(linhas)

        # Aplica a projeção de colunas às leituras (select/single).
        if self._columns is not None:
            linhas = [{c: r.get(c) for c in self._columns} for r in linhas]

        if self._single:
            return FakeResult(linhas[0] if linhas else None)

        return FakeResult(linhas)


class FakeInsert:
    """Insert pendente: atribui PK e grava na tabela no .execute()."""

    def __init__(self, fake, table_name, data):
        self._fake = fake
        self._table = table_name
        self._data = data

    def execute(self):
        linhas = self._data if isinstance(self._data, list) else [self._data]
        inseridas = []
        for r in linhas:
            nova = dict(r)
            pk = PRIMARY_KEYS.get(self._table, "id")
            nova.setdefault(pk, self._fake._next_id(self._table))
            # Simula violação de coluna UNIQUE (ex.: CPF/e-mail duplicados).
            for col in UNIQUE_CONSTRAINTS.get(self._table, []):
                if nova.get(col) is not None and self._fake._existe(self._table, col, nova[col]):
                    raise RuntimeError(f"duplicate key value violates unique constraint: {col}")
            self._fake.tables.setdefault(self._table, []).append(nova)
            inseridas.append(nova)

        # Simula o trigger fn_atualizar_vagas: nova reserva não-cancelada
        # decrementa as vagas disponíveis da excursão.
        if self._table == "reserva":
            self._fake._aplicar_vagas(inseridas)

        return FakeResult(inseridas)


class FakeTable:
    def __init__(self, fake, name):
        self._fake = fake
        self._name = name

    def _rows(self):
        return self._fake.tables.setdefault(self._name, [])

    def select(self, *cols):
        # Repassa as colunas ao método select da query (projeção).
        return FakeQuery(self._fake, self._name, self._rows()).select(*cols)

    def insert(self, data):
        return FakeInsert(self._fake, self._name, data)

    def update(self, data):
        q = FakeQuery(self._fake, self._name, self._rows())
        q._pending_update = data
        return q

    def delete(self):
        q = FakeQuery(self._fake, self._name, self._rows())
        q._pending_delete = True
        return q


class FakeSupabase:
    """Client falso: tabelas em memória com PKs reais e triggers de vagas."""

    def __init__(self):
        self.tables = {}
        self._id_counters = {}

    def table(self, name):
        return FakeTable(self, name)

    def _next_id(self, table_name):
        self._id_counters[table_name] = self._id_counters.get(table_name, 0) + 1
        return self._id_counters[table_name]

    def _encontrar_excursao(self, id_excursao):
        exc = (
            self.table("excursao")
            .select("*")
            .eq("id_excursao", id_excursao)
            .maybe_single()
            .execute()
            .data
        )
        return exc

    def _aplicar_vagas(self, reservas):
        """Trigger de INSERT: decrementa vagas_disponiveis para reservas ativas."""
        for r in reservas:
            if r.get("status") == "cancelada":
                continue
            exc = self._encontrar_excursao(r["id_excursao"])
            if exc is not None:
                exc["vagas_disponiveis"] -= r["qtd_vagas"]

    def _estornar_vagas(self, reservas):
        """Trigger de UPDATE p/ cancelada: devolve as vagas à excursão."""
        for r in reservas:
            exc = self._encontrar_excursao(r["id_excursao"])
            if exc is not None:
                exc["vagas_disponiveis"] += r["qtd_vagas"]

    def seed(self, table_name, linhas):
        """Insere linhas diretamente na tabela (sem passar pela API nem triggers)."""
        destino = self.tables.setdefault(table_name, [])
        for r in linhas:
            destino.append(dict(r))
        # Ajusta o contador de ids para não colidir com as linhas semeadas.
        pk = PRIMARY_KEYS.get(table_name, "id")
        ids = [r.get(pk, 0) for r in destino if isinstance(r.get(pk), int)]
        self._id_counters[table_name] = max(
            self._id_counters.get(table_name, 0), max(ids, default=0)
        )

    def _existe(self, table_name, col, valor):
        """Verifica se já existe uma linha com o valor em uma coluna."""
        return any(r.get(col) == valor for r in self.tables.get(table_name, []))


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture(autouse=True)
def desativar_rate_limit():
    """Desativa o rate limit para a suíte não depender de janelas de tempo."""
    limiter.enabled = False
    yield
    limiter.enabled = True


@pytest.fixture()
def fake_supabase(monkeypatch):
    """Instala o client fake substituindo a função get_supabase do módulo."""
    fake = FakeSupabase()
    monkeypatch.setattr(supabase_module, "get_supabase", lambda: fake)
    return fake


@pytest.fixture()
def client(fake_supabase):
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def cliente_token(fake_supabase):
    """Cria um cliente na tabela e retorna um JWT de cliente válido."""
    fake_supabase.seed(
        "cliente",
        [
            {
                "id_cliente": 1,
                "nome_cliente": "Cliente Teste",
                "cpf": "12345678901",
                "email": "cliente@teste.com",
                "telefone": "61999999999",
                "endereco": "Rua A, 1 - Brasilia/DF",
                "senha_hash": "fake-hash",
            }
        ],
    )
    return criar_token(usuario_id=1, papel="cliente")


@pytest.fixture()
def admin_token(fake_supabase):
    """Cria um administrador na tabela e retorna um JWT de admin válido."""
    fake_supabase.seed(
        "administrador",
        [
            {
                "id_admin": 1,
                "nome_admin": "Admin Teste",
                "login_admin": "admin",
                "senha_admin": "fake-hash",
            }
        ],
    )
    return criar_token(usuario_id=1, papel="admin")

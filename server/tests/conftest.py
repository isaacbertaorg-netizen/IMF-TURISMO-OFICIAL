# ===========================================================================
# IMF TURISMO — fixtures compartilhadas dos testes
# Substitui o client do Supabase por um fake em memória (FakeSupabase) que
# implementa a API fluente usada pelos serviços (table().select().eq()... e
# auth.sign_up/sign_in/get_user). Isso permite rodar a suíte sem credenciais
# reais e com dados determinísticos por teste.
# ===========================================================================

import re

import pytest
from fastapi.testclient import TestClient

from app.core import supabase as supabase_module
from app.core.rate_limit import limiter
from app.main import app


# ---------------------------------------------------------------------------
# Exceção usada pelo fake de auth para simular falhas do Supabase.
# ---------------------------------------------------------------------------
class AuthError(Exception):
    pass


# ---------------------------------------------------------------------------
# Objetos que reproduzem o comportamento do client Supabase que usamos.
# A API real retorna o resultado em .data após .execute(); aqui replicamos
# essa convenção para que as camadas de serviço não mudem.
# ---------------------------------------------------------------------------
class FakeResult:
    def __init__(self, data):
        self.data = data


class FakeQuery:
    """Query fluente com suporte a filtros, ordenação, update e delete."""

    def __init__(self, underlying):
        # `underlying` é a LISTA REAL da tabela (referência), para que update
        # e delete persistam as mudanças no estado do fake.
        self._underlying = underlying
        self._predicates = []
        self._order_col = None
        self._order_desc = False
        self._limit = None
        self._pending_update = None
        self._pending_delete = False
        self._single = False

    def select(self, *cols):
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
            for r in linhas:
                r.update(self._pending_update)
            return FakeResult(linhas)

        if self._pending_delete:
            for r in linhas:
                self._underlying.remove(r)
            return FakeResult(linhas)

        if self._single:
            return FakeResult(linhas[0] if linhas else None)

        return FakeResult(linhas)


class FakeInsert:
    """Insert pendente: atribui id e grava na tabela no .execute()."""

    def __init__(self, fake, table_name, data):
        self._fake = fake
        self._table_name = table_name
        self._data = data

    def execute(self):
        linhas = self._data if isinstance(self._data, list) else [self._data]
        inseridas = []
        for r in linhas:
            nova = dict(r)
            nova.setdefault("id", self._fake._next_id(self._table_name))
            self._fake.tables.setdefault(self._table_name, []).append(nova)
            inseridas.append(nova)
        return FakeResult(inseridas)


class FakeTable:
    def __init__(self, fake, name):
        self._fake = fake
        self._name = name

    def _rows(self):
        return self._fake.tables.setdefault(self._name, [])

    def select(self, *cols):
        return FakeQuery(self._rows())

    def insert(self, data):
        return FakeInsert(self._fake, self._name, data)

    def update(self, data):
        q = FakeQuery(self._rows())
        q._pending_update = data
        return q

    def delete(self):
        q = FakeQuery(self._rows())
        q._pending_delete = True
        return q


class FakeAuthResponse:
    def __init__(self, user=None, session=None):
        self.user = user
        self.session = session or {}


class FakeAuth:
    def __init__(self):
        # users: {id, email, password, session_token}
        self._users = []

    def sign_up(self, dados):
        email = dados["email"]
        if any(u["email"] == email for u in self._users):
            raise AuthError("User already registered")
        uid = f"auth-{len(self._users) + 1}"
        self._users.append(
            {
                "id": uid,
                "email": email,
                "password": dados["password"],
                "session_token": f"token-{uid}",
            }
        )
        return FakeAuthResponse(user={"id": uid, "email": email})

    def sign_in_with_password(self, dados):
        for u in self._users:
            if u["email"] == dados["email"] and u["password"] == dados["password"]:
                return FakeAuthResponse(
                    user={"id": u["id"], "email": u["email"]},
                    session={"access_token": u["session_token"], "user": u},
                )
        raise AuthError("Invalid login credentials")

    def get_user(self, token):
        for u in self._users:
            if u["session_token"] == token:
                return FakeAuthResponse(user={"id": u["id"], "email": u["email"]})
        raise AuthError("Invalid token")

    def token_para(self, email):
        """Retorna o token de acesso de um usuário (para headers nos testes)."""
        for u in self._users:
            if u["email"] == email:
                return u["session_token"]
        raise KeyError(f"usuario {email} nao cadastrado no fake auth")


class FakeSupabase:
    """Client falso: tabelas em memória + auth fake."""

    def __init__(self):
        self.tables = {}
        self._id_counters = {}
        self.auth = FakeAuth()

    def table(self, name):
        return FakeTable(self, name)

    def _next_id(self, table_name):
        self._id_counters[table_name] = self._id_counters.get(table_name, 0) + 1
        return self._id_counters[table_name]

    def seed(self, table_name, linhas):
        """Insere linhas diretamente na tabela (sem passar pela API)."""
        destino = self.tables.setdefault(table_name, [])
        for r in linhas:
            destino.append(dict(r))
        # Ajusta o contador de ids para não colidir com as linhas semeadas.
        ids = [r.get("id", 0) for r in destino if isinstance(r.get("id"), int)]
        self._id_counters[table_name] = max(
            self._id_counters.get(table_name, 0), max(ids, default=0)
        )


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
    # Como os serviços chamam supabase.get_supabase() via módulo, substituir
    # o atributo da função cobre todos os importadores de uma só vez.
    monkeypatch.setattr(supabase_module, "get_supabase", lambda: fake)
    return fake


@pytest.fixture()
def client(fake_supabase):
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def cliente_token(fake_supabase):
    """Cria um auth.user + linha em cliente e retorna o token de acesso."""
    fake_supabase.auth.sign_up({"email": "cliente@teste.com", "password": "senha123"})
    usuario = fake_supabase.auth.token_para("cliente@teste.com")
    # O id do auth.user é a chave de vínculo com a tabela cliente.
    id_auth_user = fake_supabase.auth._users[0]["id"]
    fake_supabase.seed(
        "cliente",
        [
            {
                "id": 1,
                "id_auth_user": id_auth_user,
                "nome": "Cliente Teste",
                "cpf": "12345678901",
                "email": "cliente@teste.com",
                "telefone": "61999999999",
                "endereco": "Rua A, 1 - Brasilia/DF",
            }
        ],
    )
    return usuario


@pytest.fixture()
def admin_token(fake_supabase):
    """Cria um auth.user + linha em administrador (role ADMIN) e retorna o token."""
    fake_supabase.auth.sign_up({"email": "admin@teste.com", "password": "senha123"})
    usuario = fake_supabase.auth.token_para("admin@teste.com")
    id_auth_user = fake_supabase.auth._users[0]["id"]
    fake_supabase.seed(
        "administrador",
        [
            {
                "id": 1,
                "id_auth_user": id_auth_user,
                "nome": "Admin Teste",
                "email": "admin@teste.com",
                "role": "ADMIN",
            }
        ],
    )
    return usuario

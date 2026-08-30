# ===========================================================================
# IMF TURISMO — autenticação e controle de acesso (seção 6.2 do PRODUCT.md)
# Dependências do FastAPI usadas para proteger rotas:
#   - get_current_cliente: rotas de cliente autenticado (/api/reservas/*).
#   - get_current_admin: rotas administrativas (/api/admin/*).
#
# O token é um JWT próprio (app/core/security.py) que carrega o id e o papel
# do usuário. As rotas administrativas também checam o papel 'admin' — nunca
# confiamos apenas no front-end para autorizar o acesso.
# ===========================================================================

from typing import Any

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core import supabase
from app.core.security import validar_token

# auto_error=False permite tratar a ausência do header com mensagem própria.
_bearer = HTTPBearer(auto_error=False)


def _extrair_token(credenciais: HTTPAuthorizationCredentials | None) -> str:
    """Extrai e valida o Bearer token do header Authorization."""
    if credenciais is None or credenciais.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Token de autenticacao ausente")
    return credenciais.credentials


def _validar_jwt(token: str) -> dict[str, Any]:
    """Valida o JWT e retorna o payload (id + papel)."""
    try:
        payload = validar_token(token)
    except Exception:  # noqa: BLE001 - fronteira: token inválido ou expirado vira 401.
        raise HTTPException(status_code=401, detail="Token invalido ou expirado") from None
    return payload


def get_current_cliente(
    credenciais: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict[str, Any]:
    """Dependência para rotas de cliente autenticado.

    Retorna a linha da tabela `cliente`. O id_cliente SEMPRE vem do token
    (nunca do body da requisição — seção 6.2).
    """
    token = _extrair_token(credenciais)
    payload = _validar_jwt(token)

    if payload.get("papel") != "cliente":
        raise HTTPException(status_code=403, detail="Token nao corresponde a um cliente")

    cliente = (
        supabase.get_supabase()
        .table("cliente")
        .select("*")
        .eq("id_cliente", int(payload["sub"]))
        .maybe_single()
        .execute()
        .data
    )
    if cliente is None:
        raise HTTPException(status_code=401, detail="Cliente nao encontrado")

    return cliente


def get_current_admin(
    credenciais: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict[str, Any]:
    """Dependência para rotas administrativas.

    Exige um JWT com papel 'admin' E registro na tabela `administrador`.
    Um cliente com token válido não acessa /api/admin/* (403).
    """
    token = _extrair_token(credenciais)
    payload = _validar_jwt(token)

    if payload.get("papel") != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")

    admin = (
        supabase.get_supabase()
        .table("administrador")
        .select("*")
        .eq("id_admin", int(payload["sub"]))
        .maybe_single()
        .execute()
        .data
    )
    if admin is None:
        raise HTTPException(status_code=401, detail="Administrador nao encontrado")

    return admin

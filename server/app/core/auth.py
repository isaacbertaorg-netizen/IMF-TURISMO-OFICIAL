# ===========================================================================
# IMF TURISMO — autenticação e controle de acesso (seção 6.2 do PRODUCT.md)
# Dependências do FastAPI usadas para proteger rotas:
#   - get_current_cliente: rotas de cliente autenticado (/api/reservas/*).
#   - get_current_admin: rotas administrativas (/api/admin/*).
#
# O token é extraído do header Authorization (Bearer) e validado com o
# Supabase Auth (auth.users). Depois, verificamos o vínculo do usuário com a
# tabela cliente/administrador — nunca confiamos apenas no front-end para
# autorizar o acesso.
# ===========================================================================

from typing import Any

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core import supabase

# auto_error=False permite tratar a ausência do header com mensagem própria.
_bearer = HTTPBearer(auto_error=False)


def _extrair_token(credenciais: HTTPAuthorizationCredentials | None) -> str:
    """Extrai e valida o Bearer token do header Authorization."""
    if credenciais is None or credenciais.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Token de autenticacao ausente")
    return credenciais.credentials


def _validar_usuario_auth(token: str) -> dict[str, Any]:
    """Valida o token no Supabase Auth e retorna o usuário autenticado."""
    try:
        resposta = supabase.get_supabase().auth.get_user(token)
    except Exception:  # noqa: BLE001 - fronteira com Supabase: qualquer falha de
        # validação (token inválido, expirado ou serviço indisponível) resulta
        # em não autorizado — nunca expor o motivo exato ao cliente.
        raise HTTPException(status_code=401, detail="Token invalido ou expirado") from None
    usuario = resposta.user
    if usuario is None:
        raise HTTPException(status_code=401, detail="Token invalido ou expirado")
    return usuario


def get_current_cliente(
    credenciais: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict[str, Any]:
    """Dependência para rotas de cliente autenticado.

    Retorna a linha da tabela `cliente` vinculada ao auth.user do token.
    O id_cliente SEMPRE vem do token (nunca do body da requisição).
    """
    token = _extrair_token(credenciais)
    usuario = _validar_usuario_auth(token)

    cliente = (
        supabase.get_supabase()
        .table("cliente")
        .select("*")
        .eq("id_auth_user", usuario["id"])
        .maybe_single()
        .execute()
        .data
    )
    if cliente is None:
        # Usuário válido no Supabase, mas sem registro em cliente.
        raise HTTPException(status_code=403, detail="Usuario sem perfil de cliente")

    return cliente


def get_current_admin(
    credenciais: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict[str, Any]:
    """Dependência para rotas administrativas.

    Exige usuário válido no Supabase E registro na tabela `administrador`
    com role ADMIN. Mesmo com login válido, sem role ADMIN o acesso é negado.
    """
    token = _extrair_token(credenciais)
    usuario = _validar_usuario_auth(token)

    admin = (
        supabase.get_supabase()
        .table("administrador")
        .select("*")
        .eq("id_auth_user", usuario["id"])
        .maybe_single()
        .execute()
        .data
    )
    if admin is None or admin.get("role") != "ADMIN":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")

    return admin

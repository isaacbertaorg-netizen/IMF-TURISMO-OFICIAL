# ===========================================================================
# IMF TURISMO — segurança: hash de senha e token JWT
# O schema atual (imf_turismo_schema.sql) armazena senha_hash em cliente e
# administrador e não usa Supabase Auth para essas tabelas. Por isso a API
# faz o hash com bcrypt (nunca texto puro, seção 6/RNF04) e emite tokens JWT
# assinados para sessão.
# ===========================================================================

import hashlib
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.config import settings


def gerar_hash_senha(senha: str) -> str:
    """Gera o hash bcrypt da senha. O custo (salt rounds) já vem do default do bcrypt."""
    return bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verificar_senha(senha: str, hash_armazenado: str) -> bool:
    """Compara a senha informada com o hash armazenado de forma constante."""
    try:
        return bcrypt.checkpw(senha.encode("utf-8"), hash_armazenado.encode("utf-8"))
    except ValueError:
        # Hash inválido no banco: trata como falha de autenticação, sem expor detalhes.
        return False


def criar_token(usuario_id: int, papel: str, minutos: int | None = None) -> str:
    """Emite um JWT assinado com o id e o papel do usuário.

    O papel ('cliente' ou 'admin') é usado pelas dependências de autorização
    para validar o acesso às rotas (seção 6.2).

    `minutos` permite uma validade maior no login com "Lembrar de mim", sem
    mexer na validade padrão das demais sessões.
    """
    agora = datetime.now(timezone.utc)
    payload = {
        "sub": str(usuario_id),
        "papel": papel,
        "iat": agora,
        "exp": agora + timedelta(minutes=minutos or settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def validar_token(token: str) -> dict:
    """Decodifica e valida o JWT. Lança exceção se inválido ou expirado."""
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def impressao_senha(senha_hash: str) -> str:
    """Impressão digital curta do hash atual da senha.

    O token de redefinição carrega essa impressão. Quando a senha é trocada,
    o hash muda e a impressão deixa de bater — assim o token vira de uso
    único sem precisar de tabela extra no banco.
    """
    return hashlib.sha256(senha_hash.encode("utf-8")).hexdigest()[:16]


def criar_token_reset(usuario_id: int, senha_hash: str) -> str:
    """Emite o JWT de redefinição de senha (curta duração, uso único).

    O campo `tipo` diferencia este token do token de sessão: um JWT de
    sessão nunca serve para trocar senha, e vice-versa.
    """
    agora = datetime.now(timezone.utc)
    payload = {
        "sub": str(usuario_id),
        "tipo": "reset_senha",
        "impressao": impressao_senha(senha_hash),
        "iat": agora,
        "exp": agora + timedelta(minutes=settings.reset_token_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def validar_token_reset(token: str) -> dict:
    """Valida o JWT de redefinição.

    Raises:
        jwt.InvalidTokenError: token inválido, expirado ou de outro tipo
        (ex.: um token de sessão enviado no lugar do token de reset).
    """
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    if payload.get("tipo") != "reset_senha":
        raise jwt.InvalidTokenError("Token nao e de redefinicao de senha")
    return payload

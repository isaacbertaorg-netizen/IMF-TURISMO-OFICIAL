# ===========================================================================
# IMF TURISMO — serviço de autenticação
# Cadastro e login via Supabase Auth (nota de arquitetura da seção 1 do
# PRODUCT.md): a senha vive no auth.users, nunca em texto puro no nosso banco.
#
# No cadastro, além de criar o auth.user, gravamos a linha em `cliente`
# vinculada a ele via id_auth_user — essa gravação é feita aqui no back-end
# (seção 3.3), nunca confiando apenas no front-end.
# ===========================================================================

from typing import Any

from app.core import supabase
from app.core.exceptions import (
    CredenciaisInvalidasError,
    UsuarioJaCadastradoError,
)


def cadastrar_cliente(dados: dict[str, Any]) -> dict[str, Any]:
    """Cria o usuário no Supabase Auth e o vínculo na tabela `cliente`.

    Raises:
        UsuarioJaCadastradoError: se o e-mail já existir no Supabase Auth.
    """
    auth = supabase.get_supabase().auth

    try:
        resposta = auth.sign_up({"email": dados["email"], "password": dados["senha"]})
    except Exception:  # noqa: BLE001 - fronteira com Supabase: falhas de sign_up
        # (e-mail duplicado, validação de senha, etc.) são tratadas como conflito.
        raise UsuarioJaCadastradoError("E-mail ja cadastrado") from None

    usuario = resposta.user

    # Cria a linha de cliente ligada ao auth.user recém-criado.
    supabase.get_supabase().table("cliente").insert(
        {
            "id_auth_user": usuario["id"],
            "nome": dados["nome"],
            "cpf": dados["cpf"],
            "email": dados["email"],
            "telefone": dados["telefone"],
            "endereco": dados["endereco"],
        }
    ).execute()

    return {"id_auth_user": usuario["id"], "email": dados["email"]}


def login(dados: dict[str, Any]) -> dict[str, Any]:
    """Autentica o usuário e retorna o token de acesso do Supabase Auth.

    Raises:
        CredenciaisInvalidasError: e-mail/senha incorretos.
    """
    auth = supabase.get_supabase().auth

    try:
        resposta = auth.sign_in_with_password({"email": dados["email"], "password": dados["senha"]})
    except Exception:  # noqa: BLE001 - fronteira com Supabase: credenciais
        # inválidas ou serviço indisponível são tratadas como não autorizado.
        raise CredenciaisInvalidasError("E-mail ou senha invalidos") from None

    sessao = resposta.session
    return {
        "access_token": sessao["access_token"],
        "token_type": "bearer",
    }

# ===========================================================================
# IMF TURISMO — serviço de autenticação
# Cadastro e login usando o schema real, que armazena senha_hash nas tabelas
# cliente/administrador (não usa Supabase Auth para essas entidades). As
# senhas são hasheadas com bcrypt (nunca texto puro) e a sessão usa JWT.
# ===========================================================================

from typing import Any

from app.core import supabase
from app.core.exceptions import (
    CredenciaisInvalidasError,
    UsuarioJaCadastradoError,
)
from app.core.security import criar_token, gerar_hash_senha, verificar_senha


def cadastrar_cliente(dados: dict[str, Any]) -> dict[str, Any]:
    """Cria um cliente com a senha hasheada.

    Raises:
        UsuarioJaCadastradoError: CPF ou e-mail já existentes (colunas UNIQUE).
    """
    try:
        linha = (
            supabase.get_supabase()
            .table("cliente")
            .insert(
                {
                    "nome_cliente": dados["nome"],
                    "cpf": dados["cpf"],
                    "email": dados["email"],
                    "telefone": dados["telefone"],
                    "cep": dados["cep"],
                    "logradouro": dados["logradouro"],
                    "numero": dados["numero"],
                    "complemento": dados.get("complemento") or "",
                    "bairro": dados["bairro"],
                    "cidade": dados["cidade"],
                    "uf": dados["uf"],
                    "senha_hash": gerar_hash_senha(dados["senha"]),
                }
            )
            .execute()
            .data[0]
        )
    except Exception:  # noqa: BLE001 - fronteira com Supabase: violação de UNIQUE
        # (CPF/e-mail duplicados) é tratada como conflito no cadastro.
        raise UsuarioJaCadastradoError("CPF ou e-mail ja cadastrado") from None

    return {"id_cliente": linha["id_cliente"], "email": linha["email"]}


def login(dados: dict[str, Any]) -> dict[str, Any]:
    """Autentica o cliente por e-mail + senha_hash e retorna um JWT.

    Raises:
        CredenciaisInvalidasError: e-mail inexistente ou senha incorreta.
    """
    cliente = (
        supabase.get_supabase()
        .table("cliente")
        .select("*")
        .eq("email", dados["email"])
        .maybe_single()
        .execute()
        .data
    )
    if cliente is None or not verificar_senha(dados["senha"], cliente["senha_hash"]):
        # Mesma mensagem para usuário inexistente ou senha errada (não vaza info).
        raise CredenciaisInvalidasError("E-mail ou senha invalidos")

    token = criar_token(usuario_id=cliente["id_cliente"], papel="cliente")
    return {"access_token": token, "token_type": "bearer"}


def login_admin(dados: dict[str, Any]) -> dict[str, Any]:
    """Autentica o administrador por login_admin + senha_hash e retorna um JWT.

    Raises:
        CredenciaisInvalidasError: login inexistente ou senha incorreta.
    """
    admin = (
        supabase.get_supabase()
        .table("administrador")
        .select("*")
        .eq("login_admin", dados["login"])
        .maybe_single()
        .execute()
        .data
    )
    if admin is None or not verificar_senha(dados["senha"], admin["senha_admin"]):
        raise CredenciaisInvalidasError("Login ou senha invalidos")

    token = criar_token(usuario_id=admin["id_admin"], papel="admin")
    return {"access_token": token, "token_type": "bearer"}

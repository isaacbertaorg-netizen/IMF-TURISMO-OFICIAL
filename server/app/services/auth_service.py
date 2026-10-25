# ===========================================================================
# IMF TURISMO — serviço de autenticação
# Cadastro e login usando o schema real, que armazena senha_hash nas tabelas
# cliente/administrador (não usa Supabase Auth para essas entidades). As
# senhas são hasheadas com bcrypt (nunca texto puro) e a sessão usa JWT.
# ===========================================================================

import logging
from datetime import datetime, timezone
from typing import Any

from app.config import settings
from app.core import email, supabase
from app.core.exceptions import (
    CredenciaisInvalidasError,
    TokenResetInvalidoError,
    UsuarioJaCadastradoError,
)
from app.core.lgpd import VERSAO_CONSENTIMENTOS, VERSAO_POLITICA_PRIVACIDADE
from app.core.security import (
    criar_token,
    criar_token_reset,
    gerar_hash_senha,
    impressao_senha,
    validar_token_reset,
    verificar_senha,
)

# Mensagem única da solicitação: responde igual para e-mail cadastrado ou não,
# para não revelar quais endereços existem no banco (enumeração de usuários).
MENSAGEM_SOLICITACAO_RESET = (
    "Se o e-mail estiver cadastrado, enviaremos as instruções para redefinir a senha."
)

logger = logging.getLogger(__name__)


def cadastrar_cliente(dados: dict[str, Any]) -> dict[str, Any]:
    """Cria um cliente com a senha hasheada.

    Raises:
        UsuarioJaCadastradoError: CPF ou e-mail já existentes (colunas UNIQUE).
    """
    try:
        agora = datetime.now(timezone.utc).isoformat()
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
                    # Registro do aceite obrigatório e da versão do documento.
                    # As autorizações opcionais nascem desligadas e podem ser
                    # ativadas depois no Perfil.
                    "aceite_privacidade": True,
                    "aceite_privacidade_em": agora,
                    "aceite_privacidade_versao": VERSAO_POLITICA_PRIVACIDADE,
                    "consentimento_imagem": False,
                    "consentimento_marketing": False,
                    "consentimento_compartilhamento": False,
                    "consentimentos_versao": VERSAO_CONSENTIMENTOS,
                    "consentimentos_atualizado_em": agora,
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
    cliente = supabase.buscar_um(
        supabase.get_supabase().table("cliente").select("*").eq("email", dados["email"])
    )
    if cliente is None or not verificar_senha(dados["senha"], cliente["senha_hash"]):
        # Mesma mensagem para usuário inexistente ou senha errada (não vaza info).
        raise CredenciaisInvalidasError("E-mail ou senha invalidos")

    # "Lembrar de mim" alonga a sessão para o cliente não digitar a senha a
    # cada visita; sem a opção, vale a validade curta padrão.
    minutos = settings.jwt_remember_expire_minutes if dados.get("lembrar") else None
    token = criar_token(
        usuario_id=cliente["id_cliente"], papel="cliente", minutos=minutos
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        # Pode não existir em bancos antigos; o front trata None.
        "foto_perfil_url": cliente.get("foto_perfil_url"),
    }


def login_admin(dados: dict[str, Any]) -> dict[str, Any]:
    """Autentica o administrador por login_admin + senha_hash e retorna um JWT.

    Raises:
        CredenciaisInvalidasError: login inexistente ou senha incorreta.
    """
    admin = supabase.buscar_um(
        supabase.get_supabase().table("administrador").select("*").eq("login_admin", dados["login"])
    )
    if admin is None or not verificar_senha(dados["senha"], admin["senha_admin"]):
        raise CredenciaisInvalidasError("Login ou senha invalidos")

    token = criar_token(usuario_id=admin["id_admin"], papel="admin")
    return {"access_token": token, "token_type": "bearer"}


def solicitar_reset_senha(email_destino: str) -> dict[str, str]:
    """Gera o link de redefinição e envia por e-mail, se o e-mail existir.

    Sempre retorna a mesma mensagem (com ou sem cadastro) para não vazar
    quais e-mails estão no banco. Falha de envio também não muda a resposta:
    o cliente não deve descobrir o estado interno da conta.
    """
    cliente = supabase.buscar_um(
        supabase.get_supabase().table("cliente").select("*").eq("email", email_destino)
    )

    if cliente is not None:
        token = criar_token_reset(cliente["id_cliente"], cliente["senha_hash"])
        link = f"{settings.app_url}/redefinir-senha?token={token}"
        try:
            email.enviar_link_reset(cliente["email"], cliente["nome_cliente"], link)
        except Exception:  # noqa: BLE001 - falha de SMTP não pode derrubar a rota
            # Registra para diagnóstico, mas mantém a resposta genérica.
            logger.exception(
                "Falha ao enviar e-mail de redefinicao para %s", cliente["email"]
            )

    return {"mensagem": MENSAGEM_SOLICITACAO_RESET}


def redefinir_senha(dados: dict[str, Any]) -> dict[str, str]:
    """Troca a senha do cliente a partir do token enviado por e-mail.

    Raises:
        TokenResetInvalidoError: token inválido/expirado, de outro tipo, de
        cliente inexistente ou já usado (a senha mudou desde a emissão).
    """
    try:
        payload = validar_token_reset(dados["token"])
        id_cliente = int(payload["sub"])
    except Exception:  # noqa: BLE001 - fronteira: qualquer falha do JWT vira 400.
        raise TokenResetInvalidoError() from None

    cliente = supabase.buscar_um(
        supabase.get_supabase().table("cliente").select("*").eq("id_cliente", id_cliente)
    )

    # A impressão garante uso único: se a senha já foi trocada, o hash mudou
    # e o token apresentado deixa de corresponder ao estado atual do banco.
    if cliente is None or payload.get("impressao") != impressao_senha(cliente["senha_hash"]):
        raise TokenResetInvalidoError()

    (
        supabase.get_supabase()
        .table("cliente")
        .update({"senha_hash": gerar_hash_senha(dados["senha"])})
        .eq("id_cliente", id_cliente)
        .execute()
    )

    return {"mensagem": "Senha redefinida com sucesso. Faça login com a nova senha."}

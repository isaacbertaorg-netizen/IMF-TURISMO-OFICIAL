# ===========================================================================
# IMF TURISMO — envio de e-mail
# Único ponto que fala com o servidor SMTP. A redefinição de senha depende
# dele para entregar o link ao cliente.
#
# O SMTP é OPCIONAL: sem SMTP_HOST configurado, o link é registrado no log
# apenas fora de produção. Isso permite testar o fluxo localmente sem conta
# de e-mail, sem nunca vazar o token nos logs de produção (onde qualquer
# acesso ao log poderia redefinir a senha de um cliente).
# ===========================================================================

import logging
import smtplib
from email.message import EmailMessage

from app.config import settings

logger = logging.getLogger(__name__)


def _montar_mensagem(destino: str, nome: str, link: str) -> EmailMessage:
    """Monta o e-mail em texto puro com o link de redefinição."""
    mensagem = EmailMessage()
    mensagem["Subject"] = "IMF Turismo - redefinicao de senha"
    mensagem["From"] = settings.smtp_from
    mensagem["To"] = destino
    mensagem.set_content(
        f"Ola, {nome}!\n\n"
        "Recebemos um pedido para redefinir a senha da sua conta na IMF Turismo.\n"
        f"Acesse o link abaixo para criar uma nova senha:\n\n{link}\n\n"
        f"O link expira em {settings.reset_token_expire_minutes} minutos e so "
        "pode ser usado uma vez.\n\n"
        "Se voce nao fez esse pedido, ignore esta mensagem: sua senha continua a mesma.\n"
    )
    return mensagem


def enviar_link_reset(destino: str, nome: str, link: str) -> None:
    """Envia o link de redefinição de senha para o e-mail do cliente.

    Sem SMTP configurado, não levanta erro: apenas registra o link no log
    quando o ambiente não é produção (fallback de desenvolvimento).
    """
    if not settings.smtp_host:
        if settings.expor_link_reset_no_log:
            logger.warning(
                "SMTP nao configurado. Link de redefinicao para %s: %s", destino, link
            )
        else:
            # Em produção, sem SMTP, o pedido não pode ser concluído. O log
            # não contém o link (evita sequestro de conta via leitura de log).
            logger.error(
                "SMTP nao configurado; e-mail de redefinicao nao enviado para %s.", destino
            )
        return

    # Sem remetente o servidor SMTP rejeita a mensagem. Falha cedo e explícita
    # em vez de estourar no meio do envio.
    if not settings.smtp_from:
        logger.error(
            "SMTP_FROM/SMTP_USER nao configurado; e-mail nao enviado para %s.", destino
        )
        return

    mensagem = _montar_mensagem(destino, nome, link)
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
        if settings.smtp_starttls:
            smtp.starttls()
        if settings.smtp_user:
            smtp.login(settings.smtp_user, settings.smtp_password)
        smtp.send_message(mensagem)

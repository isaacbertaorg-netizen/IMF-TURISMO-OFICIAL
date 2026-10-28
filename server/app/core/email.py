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
from datetime import date
from email.message import EmailMessage

from app.config import settings

logger = logging.getLogger(__name__)


def _formatar_data(valor: object) -> str:
    """Formata uma data ISO (AAAA-MM-DD) como DD/MM/AAAA."""
    try:
        return date.fromisoformat(str(valor)[:10]).strftime("%d/%m/%Y")
    except ValueError:
        return str(valor)


def _formatar_moeda(valor: object) -> str:
    """Formata o valor no padrão brasileiro (R$ 1.234,56)."""
    try:
        texto = f"{float(valor):,.2f}"
    except (TypeError, ValueError):
        return "a combinar"
    return "R$ " + texto.replace(",", "X").replace(".", ",").replace("X", ".")


def _enviar(mensagem: EmailMessage, destino: str, descricao: str, link: str | None = None) -> None:
    """Entrega a mensagem pelo SMTP configurado.

    Sem SMTP, registra o ocorrido e retorna sem erro: o fluxo principal (login,
    reserva etc.) não pode quebrar por causa do e-mail.
    """
    if not settings.smtp_host:
        if settings.expor_link_reset_no_log:
            if link:
                logger.warning(
                    "SMTP nao configurado. Link de %s para %s: %s", descricao, destino, link
                )
            else:
                logger.warning(
                    "SMTP nao configurado. E-mail de %s para %s nao enviado.", descricao, destino
                )
        else:
            # Em produção, sem SMTP, o pedido não pode ser concluído. O log
            # não contém links sensíveis (evita sequestro de conta via log).
            logger.error(
                "SMTP nao configurado; e-mail de %s nao enviado para %s.", descricao, destino
            )
        return

    # Sem remetente o servidor SMTP rejeita a mensagem. Falha cedo e explícita
    # em vez de estourar no meio do envio.
    if not settings.smtp_from:
        logger.error(
            "SMTP_FROM/SMTP_USER nao configurado; e-mail de %s nao enviado para %s.",
            descricao,
            destino,
        )
        return

    # local_hostname fixo: o smtplib manda o nome da máquina no EHLO. Se ele
    # tiver acento (ex.: "Isaac_Bertão"), a codificação ASCII do comando quebra
    # com UnicodeEncodeError antes mesmo do login.
    with smtplib.SMTP(
        settings.smtp_host,
        settings.smtp_port,
        local_hostname="localhost",
        timeout=15,
    ) as smtp:
        if settings.smtp_starttls:
            smtp.starttls()
        if settings.smtp_user:
            smtp.login(settings.smtp_user, settings.smtp_password)
        smtp.send_message(mensagem)


def _montar_mensagem(destino: str, nome: str, link: str) -> EmailMessage:
    """Monta o e-mail em texto puro com o link de redefinição.

    O conteúdo é UTF-8 (padrão do EmailMessage): acentos e o travessão do
    assunto são codificados corretamente no cabeçalho e no corpo.
    """
    mensagem = EmailMessage()
    mensagem["Subject"] = "IMF Turismo — redefinição de senha"
    mensagem["From"] = settings.smtp_from
    mensagem["To"] = destino
    mensagem.set_content(
        f"Olá, {nome}!\n\n"
        "Recebemos um pedido para redefinir a senha da sua conta na IMF Turismo.\n"
        f"Acesse o link abaixo para criar uma nova senha:\n\n{link}\n\n"
        f"O link expira em {settings.reset_token_expire_minutes} minutos e só "
        "pode ser usado uma vez.\n\n"
        "Se você não fez esse pedido, ignore esta mensagem: sua senha continua a mesma.\n"
    )
    return mensagem


def enviar_link_reset(destino: str, nome: str, link: str) -> None:
    """Envia o link de redefinição de senha para o e-mail do cliente.

    Sem SMTP configurado, não levanta erro: apenas registra o link no log
    quando o ambiente não é produção (fallback de desenvolvimento).
    """
    mensagem = _montar_mensagem(destino, nome, link)
    _enviar(mensagem, destino, "redefinicao de senha", link)


def _montar_confirmacao(
    destino: str,
    nome: str,
    reserva: dict,
    excursao: dict,
    confirmada: bool,
) -> EmailMessage:
    """Monta o e-mail de confirmação/recebimento do pacote."""
    titulo = "Reserva confirmada" if confirmada else "Reserva recebida"
    situacao = (
        "Pagamento confirmado. A IMF Turismo deseja uma ótima viagem!"
        if confirmada
        else "Reserva aguardando pagamento. A equipe entrará em contato pelo WhatsApp "
        "para combinar as formas de pagamento."
    )
    qtd = int(reserva.get("qtd_vagas") or 0)
    valor_pessoa = excursao.get("valor_pessoa") or 0
    total = float(valor_pessoa) * qtd

    mensagem = EmailMessage()
    mensagem["Subject"] = f"IMF Turismo — {titulo}: {excursao.get('destino', 'sua viagem')}"
    mensagem["From"] = settings.smtp_from
    mensagem["To"] = destino
    mensagem.set_content(
        f"Olá, {nome}!\n\n"
        f"Sua reserva #{reserva.get('id_reserva')} está registrada.\n\n"
        f"Pacote: {excursao.get('nome_excursao') or excursao.get('destino', '')}\n"
        f"Destino: {excursao.get('destino', '')}\n"
        f"Período: {_formatar_data(excursao.get('data_ida'))} a "
        f"{_formatar_data(excursao.get('data_volta'))}\n"
        f"Pessoas: {qtd}\n"
        f"Valor por pessoa: {_formatar_moeda(valor_pessoa)}\n"
        f"Total: {_formatar_moeda(total)}\n"
        f"Status: {situacao}\n\n"
        f"Acompanhe sua reserva em {settings.app_url}/minhas-reservas\n\n"
        "Qualquer dúvida, fale com a IMF Turismo pelo WhatsApp ou responda este e-mail.\n"
    )
    return mensagem


def enviar_confirmacao_pacote(
    destino: str,
    nome: str,
    reserva: dict,
    excursao: dict,
    confirmada: bool = False,
) -> None:
    """Envia ao cliente os dados do pacote e o status da reserva."""
    mensagem = _montar_confirmacao(destino, nome, reserva, excursao, confirmada)
    _enviar(mensagem, destino, "confirmacao de pacote")

# ===========================================================================
# IMF TURISMO — acesso ao Supabase
# Fornece uma única função para obter o client do Supabase configurado com a
# chave de serviço. O client é criado de forma preguiçosa (primeiro uso) e
# reaproveitado em toda a aplicação.
#
# Observação de segurança (seção 6.3 do PRODUCT.md): esta função usa a chave
# de serviço e deve ser importada SOMENTE pelo back-end. Em testes ela é
# substituída por um fake (ver tests/conftest.py), então a aplicação não
# precisa de credenciais reais para rodar a suíte.
# ===========================================================================

from typing import Any

from supabase import Client, create_client

from app.config import settings

# Instância única do client, criada sob demanda no primeiro acesso.
_client: Client | None = None


def get_supabase() -> Client:
    """Retorna o client do Supabase, criando-o na primeira chamada.

    Raises RuntimeError: se as variáveis de ambiente do Supabase não estiverem
    preenchidas, evitando que a API inicie silenciosamente sem banco.
    """
    global _client

    if _client is None:
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise RuntimeError(
                "Supabase nao configurado. Preencha SUPABASE_URL e "
                "SUPABASE_SERVICE_ROLE_KEY no arquivo .env (server/.env)."
            )
        _client = create_client(settings.supabase_url, settings.supabase_service_role_key)

    return _client


def buscar_um(consulta) -> dict[str, Any] | None:
    """Executa um select com filtro e retorna a primeira linha ou None.

    Não usa `maybe_single()`: no supabase-py 2.31 o `.execute()` dessa
    cadeia retorna None (e não uma resposta com data=None) quando não há
    linhas, o que quebrava login/perfil/excursão com 500. Select simples
    + primeira linha tem o mesmo efeito em qualquer versão do client.
    """
    resposta = consulta.execute()
    linhas = resposta.data if resposta is not None else []
    return linhas[0] if linhas else None

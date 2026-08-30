# ===========================================================================
# IMF TURISMO — configuração da aplicação
# Centraliza a leitura das variáveis de ambiente (seção 6.3 do PRODUCT.md).
# Os valores sensíveis (ex.: SUPABASE_SERVICE_ROLE_KEY) vêm do .env, que
# NUNCA é versionado. O python-dotenv carrega o arquivo local em desenvolvimento.
# ===========================================================================

import os

from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env para o ambiente do processo.
# Chamado no import para que todas as rotas usem os mesmos valores.
load_dotenv()


class Settings:
    """Agrupa as configurações da API lidas do ambiente."""

    def __init__(self) -> None:
        # Domínios permitidos no CORS. Em produção vem da variável de ambiente;
        # em desenvolvimento usamos a porta padrão do Vite (5173).
        raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173")
        # Separa por vírgula para aceitar múltiplas origens sem restringir o código.
        self.cors_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

        # Credenciais do Supabase. A chave de serviço é usada somente aqui no
        # back-end e nunca deve ser exposta ao front-end (seção 6.3).
        self.supabase_url = os.getenv("SUPABASE_URL", "")
        self.supabase_anon_key = os.getenv("SUPABASE_ANON_KEY", "")
        self.supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

        # Host e porta do servidor uvicorn.
        self.server_host = os.getenv("SERVER_HOST", "0.0.0.0")
        self.server_port = int(os.getenv("SERVER_PORT", "8000"))

        # Rate limiting (seção 6.5 do PRODUCT.md). As rotas públicas sensíveis
        # usam estes limites; desativar em desenvolvimento/testes via RATE_LIMIT_ENABLED=false.
        self.rate_limit_enabled = os.getenv("RATE_LIMIT_ENABLED", "true").lower() in (
            "true",
            "1",
            "yes",
        )
        self.rate_limit_login = os.getenv("RATE_LIMIT_LOGIN", "10/minute")
        self.rate_limit_cadastro = os.getenv("RATE_LIMIT_CADASTRO", "5/minute")
        self.rate_limit_reservas = os.getenv("RATE_LIMIT_RESERVAS", "20/minute")

        # JWT de sessão própria. O schema atual não usa Supabase Auth para as
        # tabelas de negócio (cliente/administrador guardam senha_hash), então
        # a API emite seus próprios tokens assinados. O secret padrão reutiliza
        # a chave de serviço; recomenda-se definir JWT_SECRET específico.
        self.jwt_secret = os.getenv("JWT_SECRET") or self.supabase_service_role_key
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        # Validade do token em minutos.
        self.jwt_expire_minutes = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))


# Instância única compartilhada por toda a aplicação.
settings = Settings()

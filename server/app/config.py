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
        # Recuperação de senha é alvo de abuso (spam de e-mail e força bruta
        # de token), então usa um limite próprio e mais restrito.
        self.rate_limit_reset = os.getenv("RATE_LIMIT_RESET", "5/minute")

        # JWT de sessão própria. O schema atual não usa Supabase Auth para as
        # tabelas de negócio (cliente/administrador guardam senha_hash), então
        # a API emite seus próprios tokens assinados. O secret padrão reutiliza
        # a chave de serviço; recomenda-se definir JWT_SECRET específico.
        self.jwt_secret = os.getenv("JWT_SECRET") or self.supabase_service_role_key
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        # Validade do token em minutos.
        self.jwt_expire_minutes = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

        # --------------------- Recuperação de senha -------------------------
        # URL pública do front-end usada para montar o link enviado por e-mail.
        # rstrip("/") evita barra dupla quando a variável termina com "/".
        self.app_url = os.getenv("APP_URL", "http://localhost:5173").rstrip("/")
        # Validade do link de redefinição. Curto de propósito: reduz a janela
        # de uso caso o e-mail seja interceptado.
        self.reset_token_expire_minutes = int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "30"))

        # SMTP opcional (Gmail, Resend, SendGrid etc.). Sem SMTP_HOST, o link
        # é registrado no log somente fora de produção (ver core/email.py).
        self.smtp_host = os.getenv("SMTP_HOST", "")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.smtp_from = os.getenv("SMTP_FROM", "") or self.smtp_user
        self.smtp_starttls = os.getenv("SMTP_STARTTLS", "true").lower() in (
            "true",
            "1",
            "yes",
        )

        # Ambiente da aplicação. O Vercel define VERCEL_ENV=production, então
        # ele serve de fallback quando APP_ENV não está configurado.
        self.ambiente = (os.getenv("APP_ENV") or os.getenv("VERCEL_ENV") or "development").lower()
        # O link de redefinição só pode aparecer no log em desenvolvimento.
        self.expor_link_reset_no_log = self.ambiente not in ("production", "producao")


# Instância única compartilhada por toda a aplicação.
settings = Settings()

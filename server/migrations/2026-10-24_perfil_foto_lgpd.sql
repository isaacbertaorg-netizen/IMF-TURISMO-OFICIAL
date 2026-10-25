-- ===========================================================================
-- IMF TURISMO — foto de perfil e consentimentos LGPD
-- Execute este arquivo no SQL Editor do Supabase (projeto de produção).
-- É idempotente: pode ser executado mais de uma vez sem erro.
--
-- `cliente`: foto do avatar e registros de aceite/autorizações.
-- `reserva`: declaração do responsável legal por passageiro menor de 18 anos.
-- ===========================================================================

ALTER TABLE public.cliente
    ADD COLUMN IF NOT EXISTS foto_perfil_url text,
    ADD COLUMN IF NOT EXISTS aceite_privacidade boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS aceite_privacidade_em timestamptz,
    ADD COLUMN IF NOT EXISTS aceite_privacidade_versao text,
    ADD COLUMN IF NOT EXISTS consentimento_imagem boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS consentimento_imagem_em timestamptz,
    ADD COLUMN IF NOT EXISTS consentimento_marketing boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS consentimento_marketing_em timestamptz,
    ADD COLUMN IF NOT EXISTS consentimento_compartilhamento boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS consentimento_compartilhamento_em timestamptz,
    ADD COLUMN IF NOT EXISTS consentimentos_versao text,
    ADD COLUMN IF NOT EXISTS consentimentos_atualizado_em timestamptz;

ALTER TABLE public.reserva
    ADD COLUMN IF NOT EXISTS declaracao_responsavel_menor boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS declaracao_responsavel_menor_em timestamptz,
    ADD COLUMN IF NOT EXISTS declaracao_responsavel_menor_versao text;

COMMENT ON COLUMN public.cliente.foto_perfil_url IS
    'URL pública da foto do avatar (bucket perfil-imagens).';
COMMENT ON COLUMN public.cliente.aceite_privacidade IS
    'Aceite da Política de Privacidade e Termos de Uso (obrigatório).';
COMMENT ON COLUMN public.cliente.consentimento_imagem IS
    'Autorização opcional para uso da imagem no site/redes sociais.';
COMMENT ON COLUMN public.cliente.consentimento_marketing IS
    'Autorização opcional para comunicações de marketing.';
COMMENT ON COLUMN public.cliente.consentimento_compartilhamento IS
    'Autorização opcional para compartilhamento com fornecedores da viagem.';
COMMENT ON COLUMN public.reserva.declaracao_responsavel_menor IS
    'Declaração do responsável legal quando há passageiro menor de 18 anos.';

# ===========================================================================
# IMF TURISMO — pacote de serviços
# Camada de regras de negócio. As rotas delegam a lógica para cá; o acesso ao
# Supabase é feito apenas por estas funções (via get_supabase), o que mantém
# a validação de vagas, prazos e filtros testável de forma isolada.
# ===========================================================================

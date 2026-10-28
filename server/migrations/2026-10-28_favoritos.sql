-- ===========================================================================
-- IMF TURISMO — favoritos do cliente
-- Cada cliente pode favoritar uma excursão uma única vez. Ao excluir o
-- cliente ou a excursão, os favoritos correspondentes são removidos.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.favorito (
  id_favorito serial PRIMARY KEY,
  id_cliente integer NOT NULL REFERENCES public.cliente(id_cliente) ON DELETE CASCADE,
  id_excursao integer NOT NULL REFERENCES public.excursao(id_excursao) ON DELETE CASCADE,
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT favorito_cliente_excursao_key UNIQUE (id_cliente, id_excursao)
);

CREATE INDEX IF NOT EXISTS idx_favorito_cliente
  ON public.favorito (id_cliente);

# ===========================================================================
# IMF TURISMO — entrada serverless da API no Vercel (api/index.py)
# Adapta o app FastAPI para o runtime Python do Vercel via Mangum, sem
# alterar o fluxo local (uvicorn continua em server/). As variáveis de
# ambiente vêm do dashboard do Vercel, nunca do repo (seção 6.3).
# ===========================================================================

import sys
from pathlib import Path

# Expõe o pacote `app` de server/ ao import do handler serverless.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "server"))

from mangum import Mangum  # noqa: E402

from app.main import app  # noqa: E402

# lifespan="off" porque a função serverless não mantém ciclo de vida.
handler = Mangum(app, lifespan="off")

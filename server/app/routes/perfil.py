# ===========================================================================
# IMF TURISMO — rotas de perfil do cliente (seção 3.6 do PRODUCT.md)
# GET /api/perfil — dados cadastrais (sem senha). PUT /api/perfil — edita
# nome, telefone e endereço. O id_cliente vem do token (seção 6.2).
# ===========================================================================

from fastapi import APIRouter, Depends, File, UploadFile

from app.config import settings
from app.core import storage
from app.core.auth import get_current_cliente
from app.schemas.cliente import ConsentimentosUpdate, PerfilUpdate
from app.services import perfil_service

router = APIRouter(tags=["perfil"])


@router.get("/api/perfil")
def obter_perfil(cliente: dict = Depends(get_current_cliente)):
    """Retorna os dados cadastrais do cliente autenticado."""
    return perfil_service.obter_perfil(cliente["id_cliente"])


@router.put("/api/perfil")
def atualizar_perfil(dados: PerfilUpdate, cliente: dict = Depends(get_current_cliente)):
    """Atualiza os dados cadastrais editáveis do cliente autenticado."""
    return perfil_service.atualizar_perfil(cliente["id_cliente"], dados.model_dump())


@router.post("/api/perfil/foto")
async def enviar_foto_perfil(
    arquivo: UploadFile = File(...),
    cliente: dict = Depends(get_current_cliente),
):
    """Envia a foto do avatar e devolve o perfil atualizado.

    O arquivo passa pela API para que a chave de serviço do Supabase nunca
    chegue ao navegador. O limite é lido com +1 byte para detectar excesso
    sem carregar um arquivo arbitrariamente grande na memória.
    """
    limite = settings.max_imagem_mb * 1024 * 1024
    conteudo = await arquivo.read(limite + 1)
    url = storage.salvar_imagem(
        conteudo,
        arquivo.content_type or "",
        pasta=f"perfis/{cliente['id_cliente']}",
        bucket=settings.storage_bucket_perfil,
    )
    return perfil_service.atualizar_foto(cliente["id_cliente"], url)


@router.delete("/api/perfil/foto")
def remover_foto_perfil(cliente: dict = Depends(get_current_cliente)):
    """Remove a foto do avatar e apaga o arquivo do Storage."""
    return perfil_service.remover_foto(cliente["id_cliente"])


@router.put("/api/perfil/consentimentos")
def atualizar_consentimentos(
    dados: ConsentimentosUpdate,
    cliente: dict = Depends(get_current_cliente),
):
    """Registra o aceite da política e as autorizações LGPD do cliente."""
    return perfil_service.atualizar_consentimentos(
        cliente["id_cliente"], dados.model_dump()
    )

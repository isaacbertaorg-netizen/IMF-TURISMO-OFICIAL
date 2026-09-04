# ===========================================================================
# IMF TURISMO — exceções de domínio
# Regras de negócio lançam estas exceções nas camadas de serviço; handlers
# globais (registrados no main.py) as convertem em respostas HTTP amigáveis.
# Separar exceções de negócio do HTTPException mantém os serviços testáveis
# fora do contexto HTTP.
# ===========================================================================

from fastapi import Request
from fastapi.responses import JSONResponse


class DomainError(Exception):
    """Base de todas as exceções de negócio da API."""

    status_code = 400
    message = "Erro de domínio"

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.message)
        self.message = message or self.message


class RecursoNaoEncontradoError(DomainError):
    status_code = 404
    message = "Recurso nao encontrado"


class VagasInsuficientesError(DomainError):
    # 409 Conflict: a excursão não comporta a quantidade solicitada.
    status_code = 409
    message = "Vagas insuficientes para a quantidade solicitada"


class PrazoCancelamentoExpiradoError(DomainError):
    status_code = 400
    message = "Prazo de cancelamento expirado"


class ReservaJaCanceladaError(DomainError):
    status_code = 400
    message = "A reserva ja esta cancelada"


class PassageirosDivergentesError(DomainError):
    # 422: a lista de passageiros deve ter exatamente um item por vaga.
    status_code = 422
    message = "A quantidade de passageiros deve ser igual a qtd_vagas"


class CredenciaisInvalidasError(DomainError):
    status_code = 401
    message = "Credenciais invalidas"


class UsuarioJaCadastradoError(DomainError):
    status_code = 409
    message = "E-mail ja cadastrado"


# ---------------------------------------------------------------------------
# Handler único que converte DomainError em JSON com código HTTP adequado.
# ---------------------------------------------------------------------------
async def domain_error_handler(_: Request, exc: DomainError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})

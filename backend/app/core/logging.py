"""
Observabilidade — structured logging com request_id e métricas.
"""
import logging
import time
import uuid
from contextvars import ContextVar
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Context var para request_id disponível em qualquer lugar
request_id_var: ContextVar[str] = ContextVar("request_id", default="")

# Logger estruturado
logger = logging.getLogger("orbita")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(f"orbita.{name}")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Loga cada request com request_id, método, path, status e duração."""

    SKIP_PATHS = {"/health", "/docs", "/openapi.json", "/redoc"}

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.url.path in self.SKIP_PATHS:
            return await call_next(request)

        req_id = str(uuid.uuid4())[:8]
        request_id_var.set(req_id)
        request.state.request_id = req_id

        start = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception as exc:
            duration = (time.perf_counter() - start) * 1000
            logger.error(
                f"[{req_id}] {request.method} {request.url.path} "
                f"ERROR {type(exc).__name__}: {exc} ({duration:.1f}ms)"
            )
            raise
        duration = (time.perf_counter() - start) * 1000

        level = logging.WARNING if response.status_code >= 400 else logging.INFO
        logger.log(
            level,
            f"[{req_id}] {request.method} {request.url.path} "
            f"{response.status_code} ({duration:.1f}ms)"
        )
        response.headers["X-Request-Id"] = req_id
        return response

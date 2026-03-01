from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.api.v1.router import api_router

settings = get_settings()

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.APP_NAME,
    description="Multi-tenant restaurant digital menu & ordering platform",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

import traceback
from fastapi.responses import JSONResponse
from fastapi import Request

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": str(exc),
            "traceback": traceback.format_exc(),
            "detail": "Global Exception Handler Caught Error"
        }
    )

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME}

@app.get("/db-test")
async def db_test():
    import traceback
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy import text
    try:
        engine = create_async_engine(
            settings.DATABASE_URL,
            connect_args={
                "statement_cache_size": 0,
                "prepared_statement_cache_size": 0,
            },
            pool_pre_ping=True
        )
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            val = result.scalar()
        await engine.dispose()
        return {"status": "success", "value": val}
    except Exception as e:
        return {"status": "error", "error": str(e), "traceback": traceback.format_exc()}

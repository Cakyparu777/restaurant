from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings
from sqlalchemy import NullPool

import uuid

settings = get_settings()

db_url = settings.DATABASE_URL
# Automatically convert asyncpg urls to psycopg urls since psycopg 3 is required for Vercel/Supabase
if db_url.startswith("postgresql+asyncpg://"):
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql+psycopg://")

engine = create_async_engine(
    db_url,
    echo=settings.DEBUG,
    poolclass=NullPool,
)


AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

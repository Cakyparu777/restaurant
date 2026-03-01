import asyncio
from logging.config import fileConfig

from sqlalchemy import pool, create_engine
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context

from app.config import get_settings
from app.database import Base

# Import all models so Alembic can see them
from app.models.restaurant import Restaurant
from app.models.user import User
from app.models.category import Category
from app.models.menu_item import MenuItem
from app.models.order import Order, OrderItem
from app.models.subscription import Subscription
from app.models.table import Table

config = context.config
settings = get_settings()

# Build sync URL directly (bypass configparser which chokes on % in passwords)
SYNC_DATABASE_URL = settings.DATABASE_URL.replace("+asyncpg", "")

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def include_object(object, name, type_, reflected, compare_to):
    """Only include objects in the public schema (skip Supabase internal schemas)."""
    if type_ == "table" and hasattr(object, "schema") and object.schema not in (None, "public"):
        return False
    return True


def run_migrations_offline() -> None:
    context.configure(
        url=SYNC_DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        include_object=include_object,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(
        SYNC_DATABASE_URL,
        poolclass=pool.NullPool,
        connect_args={"options": "-csearch_path=public"},
    )
    with connectable.connect() as connection:
        do_run_migrations(connection)
    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

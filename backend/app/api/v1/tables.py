from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_staff
from app.database import get_db
from app.models.table import Table, _generate_qr_token
from app.models.user import User
from app.schemas.table import TableCreate, TableResponse, TableUpdate

router = APIRouter(prefix="/tables", tags=["Tables"])


@router.get("", response_model=List[TableResponse])
async def list_tables(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """List all tables for the current restaurant."""
    result = await db.execute(
        select(Table)
        .where(Table.restaurant_id == current_user.restaurant_id)
        .order_by(Table.table_number)
    )
    return result.scalars().all()


@router.post("", response_model=TableResponse, status_code=status.HTTP_201_CREATED)
async def create_table(
    data: TableCreate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Create a new table for the restaurant."""
    # Check for duplicate table number
    existing = await db.execute(
        select(Table).where(
            Table.restaurant_id == current_user.restaurant_id,
            Table.table_number == data.table_number,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail=f"Table number {data.table_number} already exists",
        )

    table = Table(
        restaurant_id=current_user.restaurant_id,
        table_number=data.table_number,
        label=data.label,
        seats=data.seats,
        is_active=data.is_active,
    )
    db.add(table)
    await db.flush()
    await db.refresh(table)
    return table


@router.put("/{table_id}", response_model=TableResponse)
async def update_table(
    table_id: UUID,
    data: TableUpdate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Update a table."""
    result = await db.execute(
        select(Table).where(
            Table.id == table_id,
            Table.restaurant_id == current_user.restaurant_id,
        )
    )
    table = result.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    # Check for duplicate table number if changing
    if data.table_number is not None and data.table_number != table.table_number:
        dup = await db.execute(
            select(Table).where(
                Table.restaurant_id == current_user.restaurant_id,
                Table.table_number == data.table_number,
            )
        )
        if dup.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail=f"Table number {data.table_number} already exists",
            )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(table, field, value)

    await db.flush()
    await db.refresh(table)
    return table


@router.delete("/{table_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_table(
    table_id: UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Delete a table."""
    result = await db.execute(
        select(Table).where(
            Table.id == table_id,
            Table.restaurant_id == current_user.restaurant_id,
        )
    )
    table = result.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    await db.delete(table)
    await db.flush()


@router.post("/{table_id}/rotate-token", response_model=TableResponse)
async def rotate_qr_token(
    table_id: UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Regenerate the QR token for a table (invalidates old QR codes)."""
    result = await db.execute(
        select(Table).where(
            Table.id == table_id,
            Table.restaurant_id == current_user.restaurant_id,
        )
    )
    table = result.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    table.qr_token = _generate_qr_token()
    await db.flush()
    await db.refresh(table)
    return table

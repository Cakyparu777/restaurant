from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_owner, get_current_staff
from app.database import get_db
from app.models.menu_item import MenuItem
from app.models.user import User
from app.schemas.menu_item import MenuItemCreate, MenuItemUpdate, MenuItemResponse

router = APIRouter(prefix="/menu-items", tags=["Menu Items"])


@router.get("", response_model=List[MenuItemResponse])
async def list_menu_items(
    category_id: UUID = None,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    query = select(MenuItem).where(
        MenuItem.restaurant_id == current_user.restaurant_id
    )
    if category_id:
        query = query.where(MenuItem.category_id == category_id)
    query = query.order_by(MenuItem.sort_order)

    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED)
async def create_menu_item(
    data: MenuItemCreate,
    current_user: User = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    item = MenuItem(
        restaurant_id=current_user.restaurant_id,
        category_id=data.category_id,
        name=data.name,
        description=data.description,
        price=data.price,
        image_url=data.image_url,
        is_available=data.is_available,
        sort_order=data.sort_order,
        discount_percent=data.discount_percent,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


@router.put("/{item_id}", response_model=MenuItemResponse)
async def update_menu_item(
    item_id: UUID,
    data: MenuItemUpdate,
    current_user: User = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MenuItem).where(
            MenuItem.id == item_id,
            MenuItem.restaurant_id == current_user.restaurant_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    await db.flush()
    await db.refresh(item)
    return item


@router.patch("/{item_id}/toggle", response_model=MenuItemResponse)
async def toggle_availability(
    item_id: UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MenuItem).where(
            MenuItem.id == item_id,
            MenuItem.restaurant_id == current_user.restaurant_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    item.is_available = not item.is_available
    await db.flush()
    await db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu_item(
    item_id: UUID,
    current_user: User = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MenuItem).where(
            MenuItem.id == item_id,
            MenuItem.restaurant_id == current_user.restaurant_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    await db.delete(item)

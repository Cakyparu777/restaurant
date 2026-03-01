from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import get_current_user, get_current_owner
from app.database import get_db
from app.models.restaurant import Restaurant
from app.models.user import User
from app.models.category import Category
from app.models.menu_item import MenuItem
from app.schemas.restaurant import RestaurantUpdate, RestaurantResponse
from app.schemas.category import CategoryResponse
from app.schemas.menu_item import MenuItemResponse

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])


@router.get("/{slug}/menu")
async def get_public_menu(slug: str, db: AsyncSession = Depends(get_db)):
    """Public endpoint: get restaurant menu for customers (no auth required)."""
    result = await db.execute(
        select(Restaurant).where(Restaurant.slug == slug, Restaurant.is_active == True)
    )
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    # Get active categories with available items
    cat_result = await db.execute(
        select(Category)
        .where(Category.restaurant_id == restaurant.id, Category.is_active == True)
        .order_by(Category.sort_order)
    )
    categories = cat_result.scalars().all()

    menu = []
    for cat in categories:
        items_result = await db.execute(
            select(MenuItem)
            .where(
                MenuItem.category_id == cat.id,
                MenuItem.is_available == True,
            )
            .order_by(MenuItem.sort_order)
        )
        items = items_result.scalars().all()
        menu.append({
            "category": CategoryResponse.model_validate(cat),
            "items": [MenuItemResponse.model_validate(item) for item in items],
        })

    return {
        "restaurant": RestaurantResponse.model_validate(restaurant),
        "menu": menu,
    }


@router.get("/me", response_model=RestaurantResponse)
async def get_my_restaurant(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.restaurant_id:
        raise HTTPException(status_code=404, detail="No restaurant associated")

    result = await db.execute(
        select(Restaurant).where(Restaurant.id == current_user.restaurant_id)
    )
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant


@router.put("/me", response_model=RestaurantResponse)
async def update_my_restaurant(
    data: RestaurantUpdate,
    current_user: User = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Restaurant).where(Restaurant.id == current_user.restaurant_id)
    )
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(restaurant, field, value)

    await db.flush()
    await db.refresh(restaurant)
    return restaurant

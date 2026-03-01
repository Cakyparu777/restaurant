from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_admin
from app.database import get_db
from app.models.restaurant import Restaurant
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.restaurant import RestaurantAdminResponse
from app.schemas.subscription import SubscriptionResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/restaurants", response_model=List[RestaurantAdminResponse])
async def list_all_restaurants(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Restaurant).order_by(Restaurant.created_at.desc()))
    return result.scalars().all()


@router.patch("/restaurants/{restaurant_id}/toggle")
async def toggle_restaurant(
    restaurant_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    )
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    restaurant.is_active = not restaurant.is_active
    await db.flush()
    await db.refresh(restaurant)
    return {"id": str(restaurant.id), "is_active": restaurant.is_active}


@router.get("/subscriptions", response_model=List[SubscriptionResponse])
async def list_subscriptions(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Subscription).order_by(Subscription.starts_at.desc()))
    return result.scalars().all()

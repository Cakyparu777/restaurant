from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime
from decimal import Decimal


class MenuItemCreate(BaseModel):
    category_id: UUID
    name: str
    description: Optional[str] = None
    price: Decimal
    image_url: Optional[str] = None
    is_available: bool = True
    sort_order: int = 0
    discount_percent: int = 0


class MenuItemUpdate(BaseModel):
    category_id: Optional[UUID] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None
    sort_order: Optional[int] = None
    discount_percent: Optional[int] = None


class MenuItemResponse(BaseModel):
    id: UUID
    category_id: UUID
    restaurant_id: UUID
    name: str
    description: Optional[str] = None
    price: Decimal
    image_url: Optional[str] = None
    is_available: bool
    sort_order: int
    discount_percent: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

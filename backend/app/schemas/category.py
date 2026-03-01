from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime


class CategoryCreate(BaseModel):
    name: str
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryResponse(BaseModel):
    id: UUID
    restaurant_id: UUID
    name: str
    sort_order: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

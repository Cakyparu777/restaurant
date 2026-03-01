from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime


class TableCreate(BaseModel):
    table_number: int
    label: Optional[str] = None
    seats: int = 4
    is_active: bool = True


class TableUpdate(BaseModel):
    table_number: Optional[int] = None
    label: Optional[str] = None
    seats: Optional[int] = None
    is_active: Optional[bool] = None


class TableResponse(BaseModel):
    id: UUID
    restaurant_id: UUID
    table_number: int
    label: Optional[str] = None
    qr_token: str
    seats: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

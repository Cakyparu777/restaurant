from pydantic import BaseModel
from uuid import UUID
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class OrderItemCreate(BaseModel):
    menu_item_id: UUID
    quantity: int = 1
    special_instructions: Optional[str] = None


class OrderCreate(BaseModel):
    table_number: Optional[int] = None
    qr_token: Optional[str] = None  # Resolves to table_id
    customer_note: Optional[str] = None
    items: List[OrderItemCreate]


class OrderStatusUpdate(BaseModel):
    status: str  # pending, confirmed, preparing, ready, completed, cancelled


class OrderItemResponse(BaseModel):
    id: UUID
    menu_item_id: Optional[UUID] = None
    quantity: int
    unit_price: Decimal
    subtotal: Decimal
    special_instructions: Optional[str] = None

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: UUID
    restaurant_id: UUID
    order_number: str
    table_number: Optional[int] = None
    table_id: Optional[UUID] = None
    status: str
    total_amount: Decimal
    customer_note: Optional[str] = None
    items: List[OrderItemResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

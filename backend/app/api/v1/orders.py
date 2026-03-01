import random
import string
from typing import List, Optional
from uuid import UUID
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_staff
from app.database import get_db
from app.models.menu_item import MenuItem
from app.models.order import Order, OrderItem
from app.models.restaurant import Restaurant
from app.models.table import Table
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate
from app.services.ws_manager import ws_manager

router = APIRouter(tags=["Orders"])


def _generate_order_number() -> str:
    return "ORD-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


@router.post(
    "/restaurants/{slug}/orders",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
)
async def place_order(
    slug: str,
    data: OrderCreate,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint: customer places an order (no auth required)."""
    # Find restaurant
    result = await db.execute(
        select(Restaurant).where(Restaurant.slug == slug, Restaurant.is_active == True)
    )
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    if not data.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")

    # Resolve QR token to table
    table_id = None
    table_number = data.table_number
    if data.qr_token:
        table_result = await db.execute(
            select(Table).where(
                Table.qr_token == data.qr_token,
                Table.restaurant_id == restaurant.id,
                Table.is_active == True,
            )
        )
        table = table_result.scalar_one_or_none()
        if not table:
            raise HTTPException(status_code=400, detail="Invalid or inactive table QR code")
        table_id = table.id
        table_number = table.table_number

    # Validate menu items and calculate total
    total = Decimal("0")
    order_items = []

    for item_data in data.items:
        menu_result = await db.execute(
            select(MenuItem).where(
                MenuItem.id == item_data.menu_item_id,
                MenuItem.restaurant_id == restaurant.id,
                MenuItem.is_available == True,
            )
        )
        menu_item = menu_result.scalar_one_or_none()
        if not menu_item:
            raise HTTPException(
                status_code=400,
                detail=f"Menu item {item_data.menu_item_id} not found or unavailable",
            )

        # Apply discount
        effective_price = menu_item.price
        if menu_item.discount_percent > 0:
            effective_price = menu_item.price * (1 - Decimal(menu_item.discount_percent) / 100)

        subtotal = effective_price * item_data.quantity
        total += subtotal

        order_items.append(
            OrderItem(
                menu_item_id=menu_item.id,
                quantity=item_data.quantity,
                unit_price=effective_price,
                subtotal=subtotal,
                special_instructions=item_data.special_instructions,
            )
        )

    # Create order
    order = Order(
        restaurant_id=restaurant.id,
        order_number=_generate_order_number(),
        table_number=table_number,
        table_id=table_id,
        total_amount=total,
        customer_note=data.customer_note,
        status="pending",
    )
    db.add(order)
    await db.flush()

    # Add items
    for oi in order_items:
        oi.order_id = order.id
        db.add(oi)

    await db.flush()
    await db.refresh(order)

    # Notify restaurant dashboard via WebSocket
    await ws_manager.notify_restaurant(
        str(restaurant.id),
        {
            "type": "new_order",
            "order": OrderResponse.model_validate(order).model_dump(),
        },
    )

    return order


@router.get("/orders", response_model=List[OrderResponse])
async def list_orders(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    query = select(Order).where(Order.restaurant_id == current_user.restaurant_id)
    if status_filter:
        query = query.where(Order.status == status_filter)
    query = query.order_by(Order.created_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.restaurant_id == current_user.restaurant_id,
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: UUID,
    data: OrderStatusUpdate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    valid_statuses = {"pending", "confirmed", "preparing", "ready", "completed", "cancelled"}
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.restaurant_id == current_user.restaurant_id,
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = data.status
    await db.flush()
    await db.refresh(order)

    # Notify restaurant dashboard
    await ws_manager.notify_restaurant(
        str(current_user.restaurant_id),
        {
            "type": "order_status_update",
            "order": OrderResponse.model_validate(order).model_dump(),
        },
    )

    # Notify customer tracking the order
    await ws_manager.notify_order_status(
        str(order_id),
        {
            "type": "status_update",
            "order_id": str(order_id),
            "status": data.status,
        },
    )

    return order

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.ws_manager import ws_manager

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/orders/{restaurant_id}")
async def websocket_restaurant_orders(websocket: WebSocket, restaurant_id: str):
    """WebSocket for restaurant dashboard — receives real-time order updates."""
    await ws_manager.connect_restaurant(restaurant_id, websocket)
    try:
        while True:
            # Keep connection alive, listen for pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect_restaurant(restaurant_id, websocket)


@router.websocket("/ws/order-status/{order_id}")
async def websocket_order_status(websocket: WebSocket, order_id: str):
    """WebSocket for customer — tracks their order status in real-time."""
    await ws_manager.connect_order(order_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect_order(order_id, websocket)

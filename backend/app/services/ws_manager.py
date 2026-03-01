from typing import Dict, List
from fastapi import WebSocket
import json


class ConnectionManager:
    """Manages WebSocket connections for real-time order updates."""

    def __init__(self):
        # restaurant_id -> list of connected WebSockets (dashboard)
        self.restaurant_connections: Dict[str, List[WebSocket]] = {}
        # order_id -> list of connected WebSockets (customer tracking)
        self.order_connections: Dict[str, List[WebSocket]] = {}

    async def connect_restaurant(self, restaurant_id: str, websocket: WebSocket):
        await websocket.accept()
        if restaurant_id not in self.restaurant_connections:
            self.restaurant_connections[restaurant_id] = []
        self.restaurant_connections[restaurant_id].append(websocket)

    async def connect_order(self, order_id: str, websocket: WebSocket):
        await websocket.accept()
        if order_id not in self.order_connections:
            self.order_connections[order_id] = []
        self.order_connections[order_id].append(websocket)

    def disconnect_restaurant(self, restaurant_id: str, websocket: WebSocket):
        if restaurant_id in self.restaurant_connections:
            self.restaurant_connections[restaurant_id].remove(websocket)
            if not self.restaurant_connections[restaurant_id]:
                del self.restaurant_connections[restaurant_id]

    def disconnect_order(self, order_id: str, websocket: WebSocket):
        if order_id in self.order_connections:
            self.order_connections[order_id].remove(websocket)
            if not self.order_connections[order_id]:
                del self.order_connections[order_id]

    async def notify_restaurant(self, restaurant_id: str, data: dict):
        """Send order update to all restaurant dashboard connections."""
        if restaurant_id in self.restaurant_connections:
            message = json.dumps(data, default=str)
            dead_connections = []
            for ws in self.restaurant_connections[restaurant_id]:
                try:
                    await ws.send_text(message)
                except Exception:
                    dead_connections.append(ws)
            # Clean up dead connections
            for ws in dead_connections:
                self.restaurant_connections[restaurant_id].remove(ws)

    async def notify_order_status(self, order_id: str, data: dict):
        """Send status update to customer tracking their order."""
        if order_id in self.order_connections:
            message = json.dumps(data, default=str)
            dead_connections = []
            for ws in self.order_connections[order_id]:
                try:
                    await ws.send_text(message)
                except Exception:
                    dead_connections.append(ws)
            for ws in dead_connections:
                self.order_connections[order_id].remove(ws)


# Singleton instance
ws_manager = ConnectionManager()

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.restaurants import router as restaurants_router
from app.api.v1.categories import router as categories_router
from app.api.v1.menu_items import router as menu_items_router
from app.api.v1.orders import router as orders_router
from app.api.v1.tables import router as tables_router
from app.api.v1.admin import router as admin_router
from app.api.v1.websocket import router as ws_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(restaurants_router)
api_router.include_router(categories_router)
api_router.include_router(menu_items_router)
api_router.include_router(orders_router)
api_router.include_router(tables_router)
api_router.include_router(admin_router)
api_router.include_router(ws_router)


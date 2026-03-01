from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime


class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    logo_url: Optional[str] = None
    google_maps_url: Optional[str] = None
    settings: Optional[dict] = None


class RestaurantResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    logo_url: Optional[str] = None
    google_maps_url: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class RestaurantAdminResponse(RestaurantResponse):
    settings: Optional[dict] = None
    updated_at: datetime

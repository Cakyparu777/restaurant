from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime


class SubscriptionResponse(BaseModel):
    id: UUID
    restaurant_id: UUID
    plan: str
    status: str
    starts_at: datetime
    expires_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

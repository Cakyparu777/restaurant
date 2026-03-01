from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Optional


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    restaurant_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    restaurant_id: Optional[UUID] = None
    is_active: bool

    model_config = {"from_attributes": True}

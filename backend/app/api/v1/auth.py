import re
import traceback # Added for debug endpoint

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash, verify_password, create_access_token
from app.database import get_db
from app.models.restaurant import Restaurant
from app.models.user import User
from app.models.subscription import Subscription
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if email exists
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create restaurant
    slug = _slugify(data.restaurant_name)
    # Ensure unique slug
    slug_check = await db.execute(select(Restaurant).where(Restaurant.slug == slug))
    if slug_check.scalar_one_or_none():
        import uuid as uuid_mod
        slug = f"{slug}-{str(uuid_mod.uuid4())[:8]}"

    restaurant = Restaurant(
        name=data.restaurant_name,
        slug=slug,
    )
    db.add(restaurant)
    await db.flush()

    # Create user
    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        role="owner",
        restaurant_id=restaurant.id,
    )
    db.add(user)

    # Create free subscription
    subscription = Subscription(
        restaurant_id=restaurant.id,
        plan="free",
        status="active",
    )
    db.add(subscription)
    await db.flush()

    token = create_access_token(
        data={"sub": str(user.id), "role": user.role, "restaurant_id": str(restaurant.id)}
    )
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account deactivated",
        )

    token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role,
            "restaurant_id": str(user.restaurant_id) if user.restaurant_id else None,
        }
    )
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

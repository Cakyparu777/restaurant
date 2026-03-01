"""
Seed script to create an initial admin user.
Run: python -m app.seed
"""
import asyncio
from app.database import AsyncSessionLocal
from app.core.security import get_password_hash

# Import ALL models to resolve SQLAlchemy relationships
from app.models.restaurant import Restaurant
from app.models.user import User
from app.models.category import Category
from app.models.menu_item import MenuItem
from app.models.order import Order, OrderItem
from app.models.subscription import Subscription


async def seed():
    async with AsyncSessionLocal() as session:
        admin = User(
            email="admin@menuorder.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Platform Admin",
            role="admin",
            restaurant_id=None,
        )
        session.add(admin)
        await session.commit()
        print(f"✅ Admin user created: admin@menuorder.com / admin123")


if __name__ == "__main__":
    asyncio.run(seed())

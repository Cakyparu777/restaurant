import uuid
import secrets
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _generate_qr_token() -> str:
    """Generate a short, URL-safe token for QR codes."""
    return secrets.token_urlsafe(12)


class Table(Base):
    __tablename__ = "tables"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    restaurant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False
    )
    table_number: Mapped[int] = mapped_column(Integer, nullable=False)
    label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    qr_token: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, default=_generate_qr_token, index=True
    )
    seats: Mapped[int] = mapped_column(Integer, default=4)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    restaurant = relationship("Restaurant", back_populates="tables")
    orders = relationship("Order", back_populates="table", lazy="selectin")

    __table_args__ = (
        UniqueConstraint("restaurant_id", "table_number", name="uq_restaurant_table_number"),
        Index("ix_tables_restaurant_active", "restaurant_id", "is_active"),
    )

    def __repr__(self):
        return f"<Table {self.table_number} ({self.label or 'no label'})>"

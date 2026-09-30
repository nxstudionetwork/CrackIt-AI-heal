from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID

from app.models.notification import Notification

async def get_notifications(db: AsyncSession, user_id: UUID, skip: int = 0, limit: int = 50) -> list:
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

async def get_unread_count(db: AsyncSession, user_id: UUID) -> int:
    result = await db.execute(
        select(func.count(Notification.id))
        .where(Notification.user_id == user_id, Notification.read == False)
    )
    return result.scalar() or 0

async def mark_all_read(db: AsyncSession, user_id: UUID) -> int:
    result = await db.execute(
        select(Notification).where(Notification.user_id == user_id, Notification.read == False)
    )
    notifications = result.scalars().all()
    for n in notifications:
        n.read = True
    await db.commit()
    return len(notifications)

async def create_notification(db: AsyncSession, user_id: UUID, title: str, message: str = "", notification_type: str = "info", category: str = "system") -> Notification:
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        category=category,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return notif

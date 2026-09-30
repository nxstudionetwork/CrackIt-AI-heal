from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.notification import NotificationResponse
from app.services import notification_service

router = APIRouter()

@router.get("", response_model=list[NotificationResponse])
async def list_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    notifs = await notification_service.get_notifications(db, user.id, skip, limit)
    return [NotificationResponse(
        id=str(n.id), title=n.title, message=n.message,
        notification_type=n.notification_type, category=n.category,
        read=n.read, created_at=str(n.created_at)
    ) for n in notifs]

@router.get("/unread-count")
async def unread_count(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    count = await notification_service.get_unread_count(db, user.id)
    return {"count": count}

@router.post("/mark-all-read")
async def mark_all_read(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    count = await notification_service.mark_all_read(db, user.id)
    return {"marked": count}

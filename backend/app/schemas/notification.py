from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class NotificationResponse(BaseModel):
    id: UUID
    title: str
    message: Optional[str] = None
    notification_type: str
    category: str
    read: bool
    created_at: str

    class Config:
        from_attributes = True

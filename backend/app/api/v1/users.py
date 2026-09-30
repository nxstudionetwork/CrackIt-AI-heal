from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/me")
async def get_profile(user: User = Depends(get_current_user)):
    return {"id": str(user.id), "email": user.email, "username": user.username}

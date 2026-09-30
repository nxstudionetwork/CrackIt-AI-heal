from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, TokenRefresh, PasswordChange, UserResponse, MessageResponse
from app.services import auth_service
from app.models.user import User
from app.services.email_service import (
    send_verification_email, send_welcome_email,
    send_password_reset_email, send_password_changed_email,
)

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    try:
        user = await auth_service.register_user(db, data)
        return UserResponse(
            id=str(user.id), email=user.email, username=user.username,
            full_name=user.full_name, is_active=user.is_active,
            is_verified=user.is_verified, created_at=str(user.created_at)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result, error = await auth_service.authenticate_user(db, data.email, data.password)
    if error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=error)
    return result

@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: TokenRefresh, db: AsyncSession = Depends(get_db)):
    try:
        return await auth_service.refresh_tokens(db, data.refresh_token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id), email=current_user.email, username=current_user.username,
        full_name=current_user.full_name, is_active=current_user.is_active,
        is_verified=current_user.is_verified, avatar_url=current_user.avatar_url,
        created_at=str(current_user.created_at)
    )


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    success = await auth_service.verify_email(db, token)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification token")
    return MessageResponse(message="Email verified successfully")


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.is_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already verified")
    token = await auth_service.generate_verification_token(db, user)
    await send_verification_email(user.email, user.full_name or user.username, token)
    return MessageResponse(message="Verification email sent")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(email: str, db: AsyncSession = Depends(get_db)):
    token = await auth_service.request_password_reset(db, email)
    if token:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            await send_password_reset_email(user.email, user.full_name or user.username, token)
    return MessageResponse(message="If an account exists with that email, a reset link has been sent")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(token: str, new_password: str, db: AsyncSession = Depends(get_db)):
    success = await auth_service.reset_password(db, token, new_password)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")
    return MessageResponse(message="Password reset successfully")


@router.post("/change-password", response_model=MessageResponse)
async def change_password(body: PasswordChange, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    success = await auth_service.change_password(db, user.id, body.current_password, body.new_password)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    await send_password_changed_email(user.email, user.full_name or user.username)
    return MessageResponse(message="Password changed successfully")


@router.post("/logout", response_model=MessageResponse)
async def logout(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await auth_service.logout_session(db, user.id)
    return MessageResponse(message="Logged out successfully")

import secrets
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime, timezone, timedelta

from app.models.user import User, UserProfile, UserSession, LoginHistory
from app.schemas.auth import UserRegister, UserLogin, TokenResponse
from app.core.security import (
    verify_password, get_password_hash,
    create_access_token, create_refresh_token, decode_token
)
from app.core.config import settings

async def register_user(db: AsyncSession, data: UserRegister) -> User:
    existing = await db.execute(
        select(User).where((User.email == data.email) | (User.username == data.username))
    )
    if existing.scalar_one_or_none():
        raise ValueError("Email or username already registered")

    user = User(
        email=data.email,
        username=data.username,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
    )
    db.add(user)
    await db.flush()

    profile = UserProfile(user_id=user.id)
    db.add(profile)

    from app.models.notification import Notification
    welcome_notif = Notification(
        user_id=user.id,
        title="Welcome to CrackIt",
        message="Your account has been created successfully. Welcome to CrackIt Cybersecurity OS!",
        notification_type="success",
        category="system",
    )
    db.add(welcome_notif)

    await db.commit()
    await db.refresh(user)
    return user

async def authenticate_user(db: AsyncSession, email: str, password: str) -> tuple:
    result = await db.execute(select(User).where(User.email == email, User.deleted_at.is_(None)))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.hashed_password):
        return None, "Invalid credentials"

    if not user.is_active:
        return None, "Account is deactivated"

    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    session = UserSession(
        user_id=user.id,
        refresh_token=refresh_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(session)

    login_record = LoginHistory(
        user_id=user.id,
        email=user.email,
        status="success",
    )
    db.add(login_record)

    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    ), None

async def refresh_tokens(db: AsyncSession, refresh_token: str) -> TokenResponse:
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise ValueError("Invalid refresh token")

    user_id = payload.get("sub")
    result = await db.execute(
        select(UserSession).where(
            UserSession.refresh_token == refresh_token,
            UserSession.is_active == True,
            UserSession.user_id == UUID(user_id),
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise ValueError("Session not found or revoked")

    session.is_active = False

    new_access = create_access_token(data={"sub": str(session.user_id)})
    new_refresh = create_refresh_token(data={"sub": str(session.user_id)})

    new_session = UserSession(
        user_id=session.user_id,
        refresh_token=new_refresh,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(new_session)
    await db.commit()

    return TokenResponse(access_token=new_access, refresh_token=new_refresh)


async def verify_email(db: AsyncSession, token: str) -> bool:
    result = await db.execute(
        select(User).where(
            User.verification_token == token,
            User.verification_token_expires > datetime.now(timezone.utc),
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        return False

    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    await db.commit()
    return True


async def request_password_reset(db: AsyncSession, email: str) -> Optional[str]:
    result = await db.execute(
        select(User).where(User.email == email, User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    if not user:
        return None

    token = secrets.token_urlsafe(48)
    user.reset_token = token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    await db.commit()
    return token


async def reset_password(db: AsyncSession, token: str, new_password: str) -> bool:
    result = await db.execute(
        select(User).where(
            User.reset_token == token,
            User.reset_token_expires > datetime.now(timezone.utc),
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        return False

    user.hashed_password = get_password_hash(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    await db.commit()
    return True


async def change_password(db: AsyncSession, user_id: UUID, current_password: str, new_password: str) -> bool:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not verify_password(current_password, user.hashed_password):
        return False

    user.hashed_password = get_password_hash(new_password)
    await db.commit()
    return True


async def generate_verification_token(db: AsyncSession, user: User) -> str:
    token = secrets.token_urlsafe(48)
    user.verification_token = token
    user.verification_token_expires = datetime.now(timezone.utc) + timedelta(hours=24)
    await db.commit()
    return token


async def logout_session(db: AsyncSession, user_id: UUID) -> None:
    result = await db.execute(
        select(UserSession).where(
            UserSession.user_id == user_id,
            UserSession.is_active == True,
        )
    )
    sessions = result.scalars().all()
    for session in sessions:
        session.is_active = False
    await db.commit()

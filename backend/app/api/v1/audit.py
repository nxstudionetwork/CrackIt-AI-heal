from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.notification import AuditLog

router = APIRouter()


class AuditLogCreate(BaseModel):
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    metadata: Optional[dict] = {}


async def create_audit_log(
    db: AsyncSession,
    user_id: UUID,
    action: str,
    resource_type: str = None,
    resource_id: str = None,
    metadata: dict = None,
    ip_address: str = None,
):
    log = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        metadata=metadata or {},
        ip_address=ip_address,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.get("")
async def list_audit_logs(
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(AuditLog).where(AuditLog.user_id == user.id)
    if action:
        query = query.where(AuditLog.action == action)
    if resource_type:
        query = query.where(AuditLog.resource_type == resource_type)
    query = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    logs = result.scalars().all()
    return [
        {
            "id": str(log.id),
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "metadata": log.metadata,
            "ip_address": log.ip_address,
            "created_at": str(log.created_at),
        }
        for log in logs
    ]


@router.get("/actions")
async def list_action_types(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AuditLog.action)
        .where(AuditLog.user_id == user.id)
        .distinct()
    )
    return {"actions": [row[0] for row in result.all()]}


@router.get("/stats")
async def audit_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AuditLog).where(AuditLog.user_id == user.id)
    )
    logs = result.scalars().all()

    action_counts = {}
    resource_counts = {}
    for log in logs:
        action_counts[log.action] = action_counts.get(log.action, 0) + 1
        if log.resource_type:
            resource_counts[log.resource_type] = resource_counts.get(log.resource_type, 0) + 1

    return {
        "total_logs": len(logs),
        "action_counts": action_counts,
        "resource_counts": resource_counts,
    }

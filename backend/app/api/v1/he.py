from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.he import HEEnvironment, HESnapshot
from app.services.he_service import HEService

router = APIRouter()


class HECreate(BaseModel):
    name: str
    description: Optional[str] = None
    env_type: str
    project_id: Optional[str] = None
    target: Optional[str] = None
    authorization_confirmed: bool = False
    authorization_notes: Optional[str] = None
    resource_limits: Optional[dict] = {"cpu": "1.0", "memory": "512m", "disk": "5g"}
    container_image: Optional[str] = None


class HEUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    authorization_confirmed: Optional[bool] = None
    authorization_notes: Optional[str] = None


def he_response(e: HEEnvironment) -> dict:
    return {
        "id": str(e.id),
        "name": e.name,
        "description": e.description,
        "env_type": e.env_type,
        "status": e.status,
        "container_id": e.container_id,
        "container_image": e.container_image,
        "resource_limits": e.resource_limits,
        "authorization_confirmed": e.authorization_confirmed,
        "authorization_notes": e.authorization_notes,
        "target": e.target,
        "ports": e.ports or [],
        "project_id": str(e.project_id) if e.project_id else None,
        "owner_id": str(e.owner_id),
        "created_at": str(e.created_at),
        "updated_at": str(e.updated_at),
        "started_at": str(e.started_at) if e.started_at else None,
        "stopped_at": str(e.stopped_at) if e.stopped_at else None,
        "expires_at": str(e.expires_at) if e.expires_at else None,
    }


@router.get("")
async def list_environments(
    project_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(HEEnvironment).where(
        HEEnvironment.owner_id == user.id, HEEnvironment.deleted_at.is_(None)
    )
    if project_id:
        query = query.where(HEEnvironment.project_id == UUID(project_id))
    if status:
        query = query.where(HEEnvironment.status == status)
    query = query.order_by(HEEnvironment.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    envs = result.scalars().all()
    return [he_response(e) for e in envs]


@router.post("", status_code=201)
async def create_environment(
    data: HECreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not data.authorization_confirmed:
        raise HTTPException(
            status_code=400,
            detail="Authorization must be confirmed before creating an environment",
        )

    env = HEEnvironment(
        owner_id=user.id,
        name=data.name,
        description=data.description,
        env_type=data.env_type,
        project_id=UUID(data.project_id) if data.project_id else None,
        target=data.target,
        authorization_confirmed=data.authorization_confirmed,
        authorization_notes=data.authorization_notes,
        resource_limits=data.resource_limits,
        container_image=data.container_image,
        status="creating",
    )
    db.add(env)
    await db.commit()
    await db.refresh(env)
    return he_response(env)


@router.get("/{env_id}")
async def get_environment(
    env_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(HEEnvironment).where(
            HEEnvironment.id == UUID(env_id),
            HEEnvironment.owner_id == user.id,
            HEEnvironment.deleted_at.is_(None),
        )
    )
    env = result.scalar_one_or_none()
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    return he_response(env)


@router.put("/{env_id}")
async def update_environment(
    env_id: str,
    data: HEUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(HEEnvironment).where(
            HEEnvironment.id == UUID(env_id),
            HEEnvironment.owner_id == user.id,
            HEEnvironment.deleted_at.is_(None),
        )
    )
    env = result.scalar_one_or_none()
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(env, key, value)
    env.updated_at = datetime.now(timezone.utc)

    if update_data.get("status") == "running":
        env.started_at = datetime.now(timezone.utc)
    elif update_data.get("status") == "stopped":
        env.stopped_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(env)
    return he_response(env)


@router.post("/{env_id}/start")
async def start_environment(
    env_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(HEEnvironment).where(
            HEEnvironment.id == UUID(env_id),
            HEEnvironment.owner_id == user.id,
            HEEnvironment.deleted_at.is_(None),
        )
    )
    env = result.scalar_one_or_none()
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")

    if not env.authorization_confirmed:
        raise HTTPException(status_code=400, detail="Authorization not confirmed")

    try:
        info = await HEService.start_environment(env.id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    await db.refresh(env)
    return {**he_response(env), "container_id": info.get("container_id")}


@router.post("/{env_id}/stop")
async def stop_environment(
    env_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(HEEnvironment).where(
            HEEnvironment.id == UUID(env_id),
            HEEnvironment.owner_id == user.id,
            HEEnvironment.deleted_at.is_(None),
        )
    )
    env = result.scalar_one_or_none()
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")

    try:
        await HEService.stop_environment(env.id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    await db.refresh(env)
    return he_response(env)


@router.delete("/{env_id}")
async def delete_environment(
    env_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(HEEnvironment).where(
            HEEnvironment.id == UUID(env_id),
            HEEnvironment.owner_id == user.id,
            HEEnvironment.deleted_at.is_(None),
        )
    )
    env = result.scalar_one_or_none()
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")

    if env.status == "running":
        try:
            await HEService.stop_environment(env.id, db)
            await db.refresh(env)
        except Exception:
            pass

    env.deleted_at = datetime.now(timezone.utc)
    env.status = "terminated"
    env.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"detail": "Environment deleted"}


@router.get("/{env_id}/snapshots")
async def list_snapshots(
    env_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(HEEnvironment).where(
            HEEnvironment.id == UUID(env_id),
            HEEnvironment.owner_id == user.id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Environment not found")

    snap_result = await db.execute(
        select(HESnapshot)
        .where(HESnapshot.environment_id == UUID(env_id))
        .order_by(HESnapshot.created_at.desc())
    )
    snapshots = snap_result.scalars().all()
    return [
        {
            "id": str(s.id),
            "name": s.name,
            "description": s.description,
            "created_at": str(s.created_at),
        }
        for s in snapshots
    ]


@router.post("/{env_id}/snapshots", status_code=201)
async def create_snapshot(
    env_id: str,
    name: str = Query(...),
    description: str = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(HEEnvironment).where(
            HEEnvironment.id == UUID(env_id),
            HEEnvironment.owner_id == user.id,
        )
    )
    env = result.scalar_one_or_none()
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")

    snapshot = HESnapshot(
        environment_id=UUID(env_id),
        name=name,
        description=description,
        snapshot_data={
            "container_image": env.container_image,
            "resource_limits": env.resource_limits,
            "target": env.target,
        },
    )
    db.add(snapshot)
    await db.commit()
    await db.refresh(snapshot)
    return {
        "id": str(snapshot.id),
        "name": snapshot.name,
        "description": snapshot.description,
        "created_at": str(snapshot.created_at),
    }

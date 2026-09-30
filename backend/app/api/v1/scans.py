from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime, timezone
from app.core.database import get_db, async_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.findings import Scan
from app.services.scan_service import start_scan, ScanEngine

router = APIRouter()


class ScanCreate(BaseModel):
    scan_type: str = "quick-scan"
    target: str = ""
    project_id: Optional[str] = None
    name: Optional[str] = None


@router.get("")
async def list_scans(
    project_id: str = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Scan).order_by(Scan.created_at.desc())
    if project_id:
        query = query.where(Scan.project_id == UUID(project_id))
    result = await db.execute(query.limit(50))
    scans = result.scalars().all()
    return [{
        "id": str(s.id), "name": s.name, "scan_type": s.scan_type,
        "target": s.target, "status": s.status, "progress": s.progress,
        "created_at": str(s.created_at),
    } for s in scans]


@router.post("", status_code=202)
async def create_scan(
    data: ScanCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.scan_type not in ScanEngine.SCAN_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid scan type. Valid types: {list(ScanEngine.SCAN_TYPES.keys())}")

    scan = Scan(
        scan_type=data.scan_type,
        target=data.target,
        project_id=UUID(data.project_id) if data.project_id else None,
        status="queued",
        name=data.name or f"{data.scan_type} scan",
    )
    db.add(scan)
    await db.commit()
    await db.refresh(scan)

    await start_scan(scan.id, async_session)

    return JSONResponse(
        status_code=202,
        content={
            "id": str(scan.id),
            "status": scan.status,
            "message": f"Scan queued for execution",
        },
    )


@router.get("/{scan_id}")
async def get_scan(
    scan_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Scan).where(Scan.id == UUID(scan_id)))
    scan = result.scalar_one_or_none()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    return {
        "id": str(scan.id),
        "name": scan.name,
        "scan_type": scan.scan_type,
        "target": scan.target,
        "status": scan.status,
        "progress": scan.progress,
        "config": scan.config,
        "result_summary": scan.result_summary,
        "started_at": str(scan.started_at) if scan.started_at else None,
        "completed_at": str(scan.completed_at) if scan.completed_at else None,
        "error_message": scan.error_message,
        "created_at": str(scan.created_at),
    }


@router.get("/{scan_id}/findings")
async def get_scan_findings(
    scan_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.findings import Finding
    result = await db.execute(select(Scan).where(Scan.id == UUID(scan_id)))
    scan = result.scalar_one_or_none()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    findings_result = await db.execute(
        select(Finding).where(Finding.scan_id == UUID(scan_id)).order_by(Finding.created_at.desc())
    )
    findings = findings_result.scalars().all()

    return [{
        "id": str(f.id),
        "title": f.title,
        "description": f.description,
        "severity": f.severity,
        "status": f.status,
        "category": f.category,
        "evidence": f.evidence,
        "remediation": f.remediation,
        "created_at": str(f.created_at),
    } for f in findings]

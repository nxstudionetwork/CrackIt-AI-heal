from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime, timezone
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.findings import Finding
from app.models.project import Project
from app.schemas.finding import FindingCreate, FindingUpdate, FindingResponse

router = APIRouter()

def finding_response(f: Finding) -> FindingResponse:
    return FindingResponse(
        id=str(f.id), title=f.title, description=f.description,
        severity=f.severity, status=f.status, category=f.category,
        affected_file=f.affected_file, line_number=f.line_number,
        evidence=f.evidence, remediation=f.remediation,
        cve_id=f.cve_id, cvss_score=f.cvss_score, cwe_id=f.cwe_id,
        project_id=str(f.project_id) if f.project_id else None,
        created_at=str(f.created_at), updated_at=str(f.updated_at)
    )

@router.get("", response_model=list[FindingResponse])
async def list_findings(
    project_id: str = Query(None),
    severity: str = Query(None),
    status: str = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Finding)
        .join(Project, Finding.project_id == Project.id)
        .where(Project.owner_id == user.id, Finding.deleted_at.is_(None))
    )
    if project_id:
        query = query.where(Finding.project_id == UUID(project_id))
    if severity:
        query = query.where(Finding.severity == severity)
    if status:
        query = query.where(Finding.status == status)
    query = query.order_by(Finding.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return [finding_response(f) for f in result.scalars().all()]

@router.post("", response_model=FindingResponse)
async def create_finding(
    data: FindingCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if data.project_id:
        result = await db.execute(
            select(Project).where(
                Project.id == data.project_id,
                Project.owner_id == user.id,
                Project.deleted_at.is_(None),
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Project not found")

    finding = Finding(**data.model_dump())
    db.add(finding)
    await db.commit()
    await db.refresh(finding)
    return finding_response(finding)

@router.put("/{finding_id}", response_model=FindingResponse)
async def update_finding(
    finding_id: str,
    data: FindingUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Finding)
        .join(Project, Finding.project_id == Project.id)
        .where(
            Finding.id == UUID(finding_id),
            Project.owner_id == user.id,
        )
    )
    finding = result.scalar_one_or_none()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(finding, key, value)
    finding.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(finding)
    return finding_response(finding)

@router.delete("/{finding_id}")
async def delete_finding(
    finding_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Finding)
        .join(Project, Finding.project_id == Project.id)
        .where(
            Finding.id == UUID(finding_id),
            Project.owner_id == user.id,
        )
    )
    finding = result.scalar_one_or_none()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    finding.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    return {"detail": "Finding deleted"}

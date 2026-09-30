from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.project import Project, WorkspaceFile
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.services import project_service

router = APIRouter()

@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    projects = await project_service.get_user_projects(db, user.id, skip, limit)
    return [ProjectResponse(
        id=str(p.id), name=p.name, description=p.description,
        status=p.status, priority=p.priority, progress=p.progress,
        color=p.color, pinned=p.pinned, favorite=p.favorite, archived=p.archived,
        modules=p.modules or [], tags=p.tags or [],
        client=p.client, technology_stack=p.technology_stack,
        target_urls=p.target_urls, repository=p.repository,
        programming_language=p.programming_language, framework=p.framework,
        scope=p.scope, rules_of_engagement=p.rules_of_engagement,
        objectives=p.objectives, testing_window=p.testing_window,
        risk_level=p.risk_level,
        created_at=str(p.created_at), updated_at=str(p.updated_at)
    ) for p in projects]

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = await project_service.create_project(db, user.id, data)
    return ProjectResponse(
        id=str(project.id), name=project.name, description=project.description,
        status=project.status, priority=project.priority, progress=project.progress,
        color=project.color, pinned=project.pinned, favorite=project.favorite,
        archived=project.archived, modules=project.modules or [], tags=project.tags or [],
        client=project.client, technology_stack=project.technology_stack,
        target_urls=project.target_urls, repository=project.repository,
        programming_language=project.programming_language, framework=project.framework,
        scope=project.scope, rules_of_engagement=project.rules_of_engagement,
        objectives=project.objectives, testing_window=project.testing_window,
        risk_level=project.risk_level,
        created_at=str(project.created_at), updated_at=str(project.updated_at)
    )

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from uuid import UUID
    project = await project_service.get_project(db, UUID(project_id), user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse(
        id=str(project.id), name=project.name, description=project.description,
        status=project.status, priority=project.priority, progress=project.progress,
        color=project.color, pinned=project.pinned, favorite=project.favorite,
        archived=project.archived, modules=project.modules or [], tags=project.tags or [],
        client=project.client, technology_stack=project.technology_stack,
        target_urls=project.target_urls, repository=project.repository,
        programming_language=project.programming_language, framework=project.framework,
        scope=project.scope, rules_of_engagement=project.rules_of_engagement,
        objectives=project.objectives, testing_window=project.testing_window,
        risk_level=project.risk_level,
        created_at=str(project.created_at), updated_at=str(project.updated_at)
    )

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    data: ProjectUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from uuid import UUID
    project = await project_service.update_project(db, UUID(project_id), user.id, data)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse(
        id=str(project.id), name=project.name, description=project.description,
        status=project.status, priority=project.priority, progress=project.progress,
        color=project.color, pinned=project.pinned, favorite=project.favorite,
        archived=project.archived, modules=project.modules or [], tags=project.tags or [],
        client=project.client, technology_stack=project.technology_stack,
        target_urls=project.target_urls, repository=project.repository,
        programming_language=project.programming_language, framework=project.framework,
        scope=project.scope, rules_of_engagement=project.rules_of_engagement,
        objectives=project.objectives, testing_window=project.testing_window,
        risk_level=project.risk_level,
        created_at=str(project.created_at), updated_at=str(project.updated_at)
    )

@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from uuid import UUID
    success = await project_service.delete_project(db, UUID(project_id), user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"detail": "Project deleted"}


@router.post("/{project_id}/duplicate", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_project(
    project_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from uuid import UUID
    from datetime import datetime, timezone
    from sqlalchemy import select

    project = await project_service.get_project(db, UUID(project_id), user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    new_project = Project(
        owner_id=user.id,
        name=f"{project.name} (Copy)",
        description=project.description,
        status=project.status,
        priority=project.priority,
        color=project.color,
        modules=project.modules,
        tags=project.tags,
        client=project.client,
        technology_stack=project.technology_stack,
        target_urls=project.target_urls,
        repository=project.repository,
        programming_language=project.programming_language,
        framework=project.framework,
        scope=project.scope,
        rules_of_engagement=project.rules_of_engagement,
        objectives=project.objectives,
        testing_window=project.testing_window,
        risk_level=project.risk_level,
    )
    db.add(new_project)
    await db.flush()

    result = await db.execute(
        select(WorkspaceFile).where(
            WorkspaceFile.project_id == project.id,
            WorkspaceFile.deleted_at.is_(None),
        )
    )
    files = result.scalars().all()
    for f in files:
        new_file = WorkspaceFile(
            project_id=new_project.id,
            parent_id=f.parent_id,
            name=f.name,
            path=f.path,
            file_type=f.file_type,
            mime_type=f.mime_type,
            size=f.size,
            content=f.content,
            is_folder=f.is_folder,
        )
        db.add(new_file)

    await db.commit()
    await db.refresh(new_project)
    return ProjectResponse(
        id=str(new_project.id), name=new_project.name, description=new_project.description,
        status=new_project.status, priority=new_project.priority, progress=new_project.progress,
        color=new_project.color, pinned=new_project.pinned, favorite=new_project.favorite,
        archived=new_project.archived, modules=new_project.modules or [], tags=new_project.tags or [],
        client=new_project.client, technology_stack=new_project.technology_stack,
        target_urls=new_project.target_urls, repository=new_project.repository,
        programming_language=new_project.programming_language, framework=new_project.framework,
        scope=new_project.scope, rules_of_engagement=new_project.rules_of_engagement,
        objectives=new_project.objectives, testing_window=new_project.testing_window,
        risk_level=new_project.risk_level,
        created_at=str(new_project.created_at), updated_at=str(new_project.updated_at),
    )


@router.put("/{project_id}/pin", response_model=ProjectResponse)
async def toggle_pin(
    project_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from uuid import UUID
    from datetime import datetime, timezone

    project = await project_service.get_project(db, UUID(project_id), user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.pinned = not project.pinned
    project.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(project)
    return ProjectResponse(
        id=str(project.id), name=project.name, description=project.description,
        status=project.status, priority=project.priority, progress=project.progress,
        color=project.color, pinned=project.pinned, favorite=project.favorite,
        archived=project.archived, modules=project.modules or [], tags=project.tags or [],
        client=project.client, technology_stack=project.technology_stack,
        target_urls=project.target_urls, repository=project.repository,
        programming_language=project.programming_language, framework=project.framework,
        scope=project.scope, rules_of_engagement=project.rules_of_engagement,
        objectives=project.objectives, testing_window=project.testing_window,
        risk_level=project.risk_level,
        created_at=str(project.created_at), updated_at=str(project.updated_at),
    )


@router.put("/{project_id}/archive", response_model=ProjectResponse)
async def archive_project(
    project_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from uuid import UUID
    from datetime import datetime, timezone

    project = await project_service.get_project(db, UUID(project_id), user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.archived = not project.archived
    project.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(project)
    return ProjectResponse(
        id=str(project.id), name=project.name, description=project.description,
        status=project.status, priority=project.priority, progress=project.progress,
        color=project.color, pinned=project.pinned, favorite=project.favorite,
        archived=project.archived, modules=project.modules or [], tags=project.tags or [],
        client=project.client, technology_stack=project.technology_stack,
        target_urls=project.target_urls, repository=project.repository,
        programming_language=project.programming_language, framework=project.framework,
        scope=project.scope, rules_of_engagement=project.rules_of_engagement,
        objectives=project.objectives, testing_window=project.testing_window,
        risk_level=project.risk_level,
        created_at=str(project.created_at), updated_at=str(project.updated_at),
    )

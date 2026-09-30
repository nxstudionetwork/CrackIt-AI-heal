from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from uuid import UUID
from datetime import datetime, timezone

from app.models.project import Project, WorkspaceFile
from app.schemas.project import ProjectCreate, ProjectUpdate

async def create_project(db: AsyncSession, owner_id: UUID, data: ProjectCreate) -> Project:
    project = Project(
        owner_id=owner_id,
        name=data.name,
        description=data.description,
        status=data.status or "planning",
        priority=data.priority or "medium",
        color=data.color or "#3B82F6",
        modules=data.modules or [],
        tags=data.tags or [],
        client=data.client,
        technology_stack=data.technology_stack,
        target_urls=data.target_urls,
        repository=data.repository,
        programming_language=data.programming_language,
        framework=data.framework,
        scope=data.scope,
        rules_of_engagement=data.rules_of_engagement,
        objectives=data.objectives,
        testing_window=data.testing_window,
    )
    db.add(project)
    await db.flush()

    default_folders = ['Findings', 'Evidence', 'Screenshots', 'Reports', 'Notes', 'Exports']
    for folder in default_folders:
        f = WorkspaceFile(
            project_id=project.id,
            name=folder,
            path=f"/{folder}",
            is_folder=True,
            file_type="folder",
        )
        db.add(f)

    await db.commit()
    await db.refresh(project)
    return project

async def get_user_projects(db: AsyncSession, user_id: UUID, skip: int = 0, limit: int = 50) -> list:
    result = await db.execute(
        select(Project)
        .where(Project.owner_id == user_id, Project.deleted_at.is_(None))
        .order_by(Project.updated_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

async def get_project(db: AsyncSession, project_id: UUID, user_id: UUID) -> Project:
    result = await db.execute(
        select(Project)
        .where(Project.id == project_id, Project.owner_id == user_id, Project.deleted_at.is_(None))
    )
    return result.scalar_one_or_none()

async def update_project(db: AsyncSession, project_id: UUID, user_id: UUID, data: ProjectUpdate) -> Project:
    project = await get_project(db, project_id, user_id)
    if not project:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)
    project.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(project)
    return project

async def delete_project(db: AsyncSession, project_id: UUID, user_id: UUID) -> bool:
    project = await get_project(db, project_id, user_id)
    if not project:
        return False

    project.deleted_at = datetime.now(timezone.utc)
    project.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return True

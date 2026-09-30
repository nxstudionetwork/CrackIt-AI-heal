from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from datetime import datetime, timezone

from app.models.project import WorkspaceFile, FileVersion

async def create_file(db: AsyncSession, user_id: UUID, data) -> WorkspaceFile:
    file = WorkspaceFile(
        name=data.name,
        path=data.path,
        project_id=data.project_id,
        parent_id=data.parent_id,
        is_folder=data.is_folder if hasattr(data, 'is_folder') else False,
        content=data.content if hasattr(data, 'content') else None,
        file_type=data.file_type if hasattr(data, 'file_type') else None,
        size=len(data.content.encode()) if hasattr(data, 'content') and data.content else 0,
    )
    db.add(file)
    await db.commit()
    await db.refresh(file)
    return file

async def get_project_files(db: AsyncSession, project_id: UUID) -> list:
    result = await db.execute(
        select(WorkspaceFile)
        .where(WorkspaceFile.project_id == project_id, WorkspaceFile.deleted_at.is_(None))
        .order_by(WorkspaceFile.is_folder.desc(), WorkspaceFile.name)
    )
    return result.scalars().all()

async def get_file(db: AsyncSession, file_id: UUID) -> WorkspaceFile:
    result = await db.execute(
        select(WorkspaceFile).where(WorkspaceFile.id == file_id, WorkspaceFile.deleted_at.is_(None))
    )
    return result.scalar_one_or_none()

async def update_file(db: AsyncSession, file_id: UUID, data) -> WorkspaceFile:
    file = await get_file(db, file_id)
    if not file:
        return None

    update_data = data.model_dump(exclude_unset=True)

    if "content" in update_data and update_data["content"] is not None:
        max_version_result = await db.execute(
            select(func.coalesce(func.max(FileVersion.version_number), 0))
            .where(FileVersion.file_id == file.id)
        )
        next_version = max_version_result.scalar() + 1

        version = FileVersion(
            file_id=file.id,
            version_number=next_version,
            content=file.content,
            size=file.size,
        )
        db.add(version)
        file.size = len(update_data["content"].encode())

    for key, value in update_data.items():
        setattr(file, key, value)
    file.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(file)
    return file

async def delete_file(db: AsyncSession, file_id: UUID) -> bool:
    file = await get_file(db, file_id)
    if not file:
        return False
    file.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    return True

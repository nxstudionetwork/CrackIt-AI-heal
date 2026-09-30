from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.file import FileCreate, FileUpdate, FileResponse
from app.services import file_service

router = APIRouter()

@router.get("", response_model=list[FileResponse])
async def list_files(
    project_id: str = Query(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    files = await file_service.get_project_files(db, UUID(project_id))
    return [FileResponse(
        id=str(f.id), name=f.name, path=f.path, file_type=f.file_type,
        size=f.size, is_folder=f.is_folder, is_favorite=f.is_favorite,
        content=f.content, project_id=str(f.project_id) if f.project_id else None,
        parent_id=str(f.parent_id) if f.parent_id else None,
        created_at=str(f.created_at), updated_at=str(f.updated_at)
    ) for f in files]

@router.post("", response_model=FileResponse)
async def create_file(
    data: FileCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    file = await file_service.create_file(db, user.id, data)
    return FileResponse(
        id=str(file.id), name=file.name, path=file.path, file_type=file.file_type,
        size=file.size, is_folder=file.is_folder, is_favorite=file.is_favorite,
        content=file.content, project_id=str(file.project_id) if file.project_id else None,
        parent_id=str(file.parent_id) if file.parent_id else None,
        created_at=str(file.created_at), updated_at=str(file.updated_at)
    )

@router.get("/{file_id}", response_model=FileResponse)
async def get_file(
    file_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    file = await file_service.get_file(db, UUID(file_id))
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(
        id=str(file.id), name=file.name, path=file.path, file_type=file.file_type,
        size=file.size, is_folder=file.is_folder, is_favorite=file.is_favorite,
        content=file.content, project_id=str(file.project_id) if file.project_id else None,
        parent_id=str(file.parent_id) if file.parent_id else None,
        created_at=str(file.created_at), updated_at=str(file.updated_at)
    )

@router.put("/{file_id}", response_model=FileResponse)
async def update_file(
    file_id: str,
    data: FileUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    file = await file_service.update_file(db, UUID(file_id), data)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(
        id=str(file.id), name=file.name, path=file.path, file_type=file.file_type,
        size=file.size, is_folder=file.is_folder, is_favorite=file.is_favorite,
        content=file.content, project_id=str(file.project_id) if file.project_id else None,
        parent_id=str(file.parent_id) if file.parent_id else None,
        created_at=str(file.created_at), updated_at=str(file.updated_at)
    )

@router.delete("/{file_id}")
async def delete_file(
    file_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    success = await file_service.delete_file(db, UUID(file_id))
    if not success:
        raise HTTPException(status_code=404, detail="File not found")
    return {"detail": "File deleted"}

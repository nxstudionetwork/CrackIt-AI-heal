from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class FileCreate(BaseModel):
    name: str
    path: str
    project_id: Optional[UUID] = None
    parent_id: Optional[UUID] = None
    is_folder: Optional[bool] = False
    content: Optional[str] = None
    file_type: Optional[str] = None

class FileUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    is_favorite: Optional[bool] = None

class FileResponse(BaseModel):
    id: UUID
    name: str
    path: str
    file_type: Optional[str] = None
    size: int
    is_folder: bool
    is_favorite: bool
    content: Optional[str] = None
    project_id: Optional[UUID] = None
    parent_id: Optional[UUID] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

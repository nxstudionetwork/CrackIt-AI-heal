from pydantic import BaseModel
from typing import Optional, List


class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = None
    folder: Optional[str] = None
    tags: Optional[List[str]] = []
    pinned: Optional[bool] = False
    favorite: Optional[bool] = False
    word_count: Optional[str] = "0"
    project_id: Optional[str] = None
    module: Optional[str] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    folder: Optional[str] = None
    tags: Optional[List[str]] = None
    pinned: Optional[bool] = None
    favorite: Optional[bool] = None
    word_count: Optional[str] = None
    module: Optional[str] = None


class NoteResponse(BaseModel):
    id: str
    title: str
    content: Optional[str] = None
    folder: Optional[str] = None
    tags: List[str] = []
    pinned: bool = False
    favorite: bool = False
    word_count: str = "0"
    project_id: Optional[str] = None
    module: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

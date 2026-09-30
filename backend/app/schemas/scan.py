from pydantic import BaseModel
from typing import Optional
from uuid import UUID


class ScanCreate(BaseModel):
    scan_type: str = "static-analysis"
    target: str = ""
    project_id: Optional[UUID] = None
    name: Optional[str] = None


class ScanResponse(BaseModel):
    id: str
    name: Optional[str] = None
    scan_type: str
    target: Optional[str] = None
    status: str
    progress: int
    created_at: str

    class Config:
        from_attributes = True

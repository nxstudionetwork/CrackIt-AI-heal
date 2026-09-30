from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "planning"
    priority: Optional[str] = "medium"
    color: Optional[str] = "#3B82F6"
    modules: Optional[List[str]] = []
    tags: Optional[List[str]] = []
    client: Optional[str] = None
    technology_stack: Optional[str] = None
    target_urls: Optional[str] = None
    repository: Optional[str] = None
    programming_language: Optional[str] = None
    framework: Optional[str] = None
    scope: Optional[str] = None
    rules_of_engagement: Optional[str] = None
    objectives: Optional[str] = None
    testing_window: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    progress: Optional[int] = None
    color: Optional[str] = None
    pinned: Optional[bool] = None
    favorite: Optional[bool] = None
    archived: Optional[bool] = None
    tags: Optional[List[str]] = None
    client: Optional[str] = None
    technology_stack: Optional[str] = None
    target_urls: Optional[str] = None
    repository: Optional[str] = None
    programming_language: Optional[str] = None
    framework: Optional[str] = None
    scope: Optional[str] = None
    rules_of_engagement: Optional[str] = None
    objectives: Optional[str] = None
    testing_window: Optional[str] = None
    settings: Optional[dict] = None

class ProjectResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    status: str
    priority: str
    progress: int
    color: str
    pinned: bool
    favorite: bool
    archived: bool
    modules: List[str] = []
    tags: List[str] = []
    client: Optional[str] = None
    technology_stack: Optional[str] = None
    target_urls: Optional[str] = None
    repository: Optional[str] = None
    programming_language: Optional[str] = None
    framework: Optional[str] = None
    scope: Optional[str] = None
    rules_of_engagement: Optional[str] = None
    objectives: Optional[str] = None
    testing_window: Optional[str] = None
    risk_level: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

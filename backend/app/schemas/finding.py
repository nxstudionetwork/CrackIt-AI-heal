from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID

class FindingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    severity: str
    status: Optional[str] = "open"
    category: Optional[str] = None
    affected_file: Optional[str] = None
    line_number: Optional[int] = None
    evidence: Optional[str] = None
    technical_explanation: Optional[str] = None
    remediation: Optional[str] = None
    cve_id: Optional[str] = None
    cvss_score: Optional[float] = None
    cwe_id: Optional[str] = None
    owasp_category: Optional[str] = None
    project_id: Optional[UUID] = None
    scan_id: Optional[UUID] = None

class FindingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    evidence: Optional[str] = None
    remediation: Optional[str] = None
    comments: Optional[List[dict]] = None

class FindingResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    severity: str
    status: str
    category: Optional[str] = None
    affected_file: Optional[str] = None
    line_number: Optional[int] = None
    evidence: Optional[str] = None
    remediation: Optional[str] = None
    cve_id: Optional[str] = None
    cvss_score: Optional[float] = None
    cwe_id: Optional[str] = None
    project_id: Optional[UUID] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

from pydantic import BaseModel
from typing import Optional, List


class ClientCreate(BaseModel):
    name: str
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    status: Optional[str] = "active"
    risk_level: Optional[str] = "low"
    nda_status: Optional[str] = "pending"
    contract_status: Optional[str] = "pending"
    notes: Optional[str] = None
    tags: Optional[List[str]] = []


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    status: Optional[str] = None
    risk_level: Optional[str] = None
    nda_status: Optional[str] = None
    contract_status: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class ClientResponse(BaseModel):
    id: str
    name: str
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    status: str = "active"
    risk_level: str = "low"
    nda_status: str = "pending"
    contract_status: str = "pending"
    notes: Optional[str] = None
    tags: List[str] = []
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

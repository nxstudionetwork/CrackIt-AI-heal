from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime, timezone
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.client import Client
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse

router = APIRouter()


@router.get("", response_model=list[ClientResponse])
async def list_clients(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Client)
        .where(Client.owner_id == user.id, Client.deleted_at.is_(None))
        .order_by(Client.updated_at.desc())
        .offset(skip).limit(limit)
    )
    clients = result.scalars().all()
    return [ClientResponse(
        id=str(c.id), name=c.name, company=c.company,
        email=c.email, phone=c.phone, industry=c.industry,
        website=c.website, address=c.address, contact_person=c.contact_person,
        status=c.status, risk_level=c.risk_level,
        nda_status=c.nda_status, contract_status=c.contract_status,
        notes=c.notes, tags=c.tags or [],
        created_at=str(c.created_at), updated_at=str(c.updated_at)
    ) for c in clients]


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    data: ClientCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    client = Client(
        owner_id=user.id,
        name=data.name,
        company=data.company,
        email=data.email,
        phone=data.phone,
        industry=data.industry,
        website=data.website,
        address=data.address,
        contact_person=data.contact_person,
        status=data.status or "active",
        risk_level=data.risk_level or "low",
        nda_status=data.nda_status or "pending",
        contract_status=data.contract_status or "pending",
        notes=data.notes,
        tags=data.tags or [],
    )
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return ClientResponse(
        id=str(client.id), name=client.name, company=client.company,
        email=client.email, phone=client.phone, industry=client.industry,
        website=client.website, address=client.address, contact_person=client.contact_person,
        status=client.status, risk_level=client.risk_level,
        nda_status=client.nda_status, contract_status=client.contract_status,
        notes=client.notes, tags=client.tags or [],
        created_at=str(client.created_at), updated_at=str(client.updated_at)
    )


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Client).where(
            Client.id == UUID(client_id), Client.owner_id == user.id, Client.deleted_at.is_(None)
        )
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return ClientResponse(
        id=str(client.id), name=client.name, company=client.company,
        email=client.email, phone=client.phone, industry=client.industry,
        website=client.website, address=client.address, contact_person=client.contact_person,
        status=client.status, risk_level=client.risk_level,
        nda_status=client.nda_status, contract_status=client.contract_status,
        notes=client.notes, tags=client.tags or [],
        created_at=str(client.created_at), updated_at=str(client.updated_at)
    )


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: str,
    data: ClientUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Client).where(
            Client.id == UUID(client_id), Client.owner_id == user.id, Client.deleted_at.is_(None)
        )
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(client, key, value)
    client.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(client)
    return ClientResponse(
        id=str(client.id), name=client.name, company=client.company,
        email=client.email, phone=client.phone, industry=client.industry,
        website=client.website, address=client.address, contact_person=client.contact_person,
        status=client.status, risk_level=client.risk_level,
        nda_status=client.nda_status, contract_status=client.contract_status,
        notes=client.notes, tags=client.tags or [],
        created_at=str(client.created_at), updated_at=str(client.updated_at)
    )


@router.delete("/{client_id}")
async def delete_client(
    client_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Client).where(
            Client.id == UUID(client_id), Client.owner_id == user.id, Client.deleted_at.is_(None)
        )
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    client.deleted_at = datetime.now(timezone.utc)
    client.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"detail": "Client deleted"}

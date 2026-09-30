from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime, timezone
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse

router = APIRouter()


@router.get("", response_model=list[NoteResponse])
async def list_notes(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: str = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Note).where(Note.owner_id == user.id, Note.deleted_at.is_(None))
    if project_id:
        query = query.where(Note.project_id == project_id)
    query = query.order_by(Note.updated_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    notes = result.scalars().all()
    return [NoteResponse(
        id=str(n.id), title=n.title, content=n.content,
        folder=n.folder, tags=n.tags or [], pinned=n.pinned, favorite=n.favorite,
        word_count=n.word_count or "0", project_id=str(n.project_id) if n.project_id else None,
        module=n.module,
        created_at=str(n.created_at), updated_at=str(n.updated_at)
    ) for n in notes]


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    data: NoteCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    note = Note(
        owner_id=user.id,
        title=data.title,
        content=data.content,
        folder=data.folder,
        tags=data.tags or [],
        pinned=data.pinned or False,
        favorite=data.favorite or False,
        word_count=data.word_count or "0",
        project_id=UUID(data.project_id) if data.project_id else None,
        module=data.module,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return NoteResponse(
        id=str(note.id), title=note.title, content=note.content,
        folder=note.folder, tags=note.tags or [], pinned=note.pinned, favorite=note.favorite,
        word_count=note.word_count or "0",
        project_id=str(note.project_id) if note.project_id else None,
        module=note.module,
        created_at=str(note.created_at), updated_at=str(note.updated_at)
    )


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Note).where(
            Note.id == UUID(note_id), Note.owner_id == user.id, Note.deleted_at.is_(None)
        )
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return NoteResponse(
        id=str(note.id), title=note.title, content=note.content,
        folder=note.folder, tags=note.tags or [], pinned=note.pinned, favorite=note.favorite,
        word_count=note.word_count or "0",
        project_id=str(note.project_id) if note.project_id else None,
        module=note.module,
        created_at=str(note.created_at), updated_at=str(note.updated_at)
    )


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: str,
    data: NoteUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Note).where(
            Note.id == UUID(note_id), Note.owner_id == user.id, Note.deleted_at.is_(None)
        )
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(note, key, value)
    note.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(note)
    return NoteResponse(
        id=str(note.id), title=note.title, content=note.content,
        folder=note.folder, tags=note.tags or [], pinned=note.pinned, favorite=note.favorite,
        word_count=note.word_count or "0",
        project_id=str(note.project_id) if note.project_id else None,
        module=note.module,
        created_at=str(note.created_at), updated_at=str(note.updated_at)
    )


@router.delete("/{note_id}")
async def delete_note(
    note_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Note).where(
            Note.id == UUID(note_id), Note.owner_id == user.id, Note.deleted_at.is_(None)
        )
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    note.deleted_at = datetime.now(timezone.utc)
    note.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"detail": "Note deleted"}

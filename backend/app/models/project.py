import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Integer, JSON, Float, Index
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from app.core.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="planning")
    priority = Column(String(50), default="medium")
    progress = Column(Integer, default=0)
    color = Column(String(20), default="#3B82F6")
    pinned = Column(Boolean, default=False)
    favorite = Column(Boolean, default=False)
    archived = Column(Boolean, default=False)
    project_type = Column(String(100), nullable=True)
    modules = Column(JSON, default=list)
    tags = Column(JSON, default=list)
    client = Column(String(255), nullable=True)
    technology_stack = Column(Text, nullable=True)
    target_urls = Column(Text, nullable=True)
    repository = Column(String(500), nullable=True)
    programming_language = Column(String(100), nullable=True)
    framework = Column(String(100), nullable=True)
    scope = Column(Text, nullable=True)
    rules_of_engagement = Column(Text, nullable=True)
    objectives = Column(Text, nullable=True)
    testing_window = Column(String(100), nullable=True)
    risk_level = Column(String(50), nullable=True)
    settings = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    owner = relationship("User", back_populates="projects")
    files = relationship("WorkspaceFile", back_populates="project")
    findings = relationship("Finding", back_populates="project")
    scans = relationship("Scan", back_populates="project")

class WorkspaceFile(Base):
    __tablename__ = "workspace_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("workspace_files.id"), nullable=True)
    name = Column(String(255), nullable=False)
    path = Column(Text, nullable=False)
    file_type = Column(String(50), nullable=True)
    mime_type = Column(String(100), nullable=True)
    size = Column(Integer, default=0)
    content = Column(Text, nullable=True)
    is_folder = Column(Boolean, default=False)
    is_favorite = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="files")
    versions = relationship("FileVersion", back_populates="file")

    __table_args__ = (
        Index("ix_workspace_files_project_id", "project_id"),
    )

class FileVersion(Base):
    __tablename__ = "file_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_id = Column(UUID(as_uuid=True), ForeignKey("workspace_files.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    content = Column(Text, nullable=True)
    size = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    file = relationship("WorkspaceFile", back_populates="versions")

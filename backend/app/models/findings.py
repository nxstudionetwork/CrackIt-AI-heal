import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Integer, JSON, Float, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Finding(Base):
    __tablename__ = "findings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("scans.id"), nullable=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(50), nullable=False)
    confidence = Column(String(50), nullable=True)
    status = Column(String(50), default="open")
    category = Column(String(100), nullable=True)
    affected_file = Column(String(500), nullable=True)
    affected_resource = Column(String(500), nullable=True)
    line_number = Column(Integer, nullable=True)
    evidence = Column(Text, nullable=True)
    technical_explanation = Column(Text, nullable=True)
    remediation = Column(Text, nullable=True)
    cve_id = Column(String(50), nullable=True)
    cvss_score = Column(Float, nullable=True)
    cwe_id = Column(String(50), nullable=True)
    owasp_category = Column(String(50), nullable=True)
    analyzer = Column(String(100), nullable=True)
    tags = Column(JSON, default=list)
    comments = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project", back_populates="findings")
    scan = relationship("Scan", back_populates="findings")

    __table_args__ = (
        Index("ix_findings_project_id_severity", "project_id", "severity"),
    )

class Scan(Base):
    __tablename__ = "scans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    name = Column(String(255), nullable=True)
    scan_type = Column(String(100), nullable=False)
    target = Column(String(500), nullable=True)
    status = Column(String(50), default="queued")
    progress = Column(Integer, default=0)
    config = Column(JSON, default=dict)
    result_summary = Column(JSON, default=dict)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="scans")
    findings = relationship("Finding", back_populates="scan")

    __table_args__ = (
        Index("ix_scans_project_id_status", "project_id", "status"),
    )

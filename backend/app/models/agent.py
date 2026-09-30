"""AI Agent models."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, ForeignKey, JSON, Enum as SAEnum, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class AgentStatus(str, enum.Enum):
    QUEUED = "queued"
    PLANNING = "planning"
    RUNNING = "running"
    WAITING_FOR_APPROVAL = "waiting_for_approval"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class PermissionLevel(str, enum.Enum):
    READ_ONLY = "read_only"
    APPROVAL_REQUIRED = "approval_required"
    EXECUTION_REQUIRED = "execution_required"
    RESTRICTED = "restricted"

class Agent(Base):
    __tablename__ = "ai_agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    system_instructions = Column(Text, nullable=False)
    allowed_tools = Column(JSON, default=list)
    default_model = Column(String(255), default="gpt-4")
    max_steps = Column(Integer, default=20)
    timeout_seconds = Column(Integer, default=300)
    is_builtin = Column(Boolean, default=False)
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class AgentTool(Base):
    __tablename__ = "ai_agent_tools"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tool_id = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    input_schema = Column(JSON, default=dict)
    output_schema = Column(JSON, default=dict)
    permission_level = Column(String(50), default="read_only")
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class AgentRun(Base):
    __tablename__ = "ai_agent_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("ai_agents.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    model = Column(String(255), default="gpt-4")
    status = Column(String(50), default="queued")
    current_step = Column(Integer, default=0)
    max_steps = Column(Integer, default=20)
    result_summary = Column(Text, default="")
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    agent = relationship("Agent")

    __table_args__ = (
        Index("ix_agent_runs_user_id_status", "user_id", "status"),
        Index("ix_agent_runs_agent_id", "agent_id"),
    )

class AgentStep(Base):
    __tablename__ = "ai_agent_steps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(UUID(as_uuid=True), ForeignKey("ai_agent_runs.id"), nullable=False)
    step_number = Column(Integer, nullable=False)
    step_type = Column(String(50), nullable=False)
    tool_used = Column(String(255), nullable=True)
    input_summary = Column(Text, default="")
    output_summary = Column(Text, default="")
    status = Column(String(50), default="completed")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    run = relationship("AgentRun", backref="steps")

class AgentApproval(Base):
    __tablename__ = "ai_agent_approvals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(UUID(as_uuid=True), ForeignKey("ai_agent_runs.id"), nullable=False)
    step_id = Column(UUID(as_uuid=True), ForeignKey("ai_agent_steps.id"), nullable=True)
    action_description = Column(Text, nullable=False)
    affected_files = Column(JSON, default=list)
    status = Column(String(50), default="pending")
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    decided_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    run = relationship("AgentRun")

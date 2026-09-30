"""initial schema

Revision ID: 001_initial
Revises:
Create Date: 2026-07-13
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- users ---
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("username", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean, server_default=sa.text("true")),
        sa.Column("is_verified", sa.Boolean, server_default=sa.text("false")),
        sa.Column("is_superuser", sa.Boolean, server_default=sa.text("false")),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("verification_token", sa.String(255), nullable=True),
        sa.Column("verification_token_expires", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reset_token", sa.String(255), nullable=True),
        sa.Column("reset_token_expires", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # --- user_profiles ---
    op.create_table(
        "user_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), unique=True, nullable=False),
        sa.Column("bio", sa.Text, nullable=True),
        sa.Column("organization", sa.String(255), nullable=True),
        sa.Column("role", sa.String(100), nullable=True),
        sa.Column("preferences", postgresql.JSON, server_default=sa.text("'{}'::jsonb")),
        sa.Column("notification_preferences", postgresql.JSON, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- user_sessions ---
    op.create_table(
        "user_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("refresh_token", sa.String(500), nullable=False),
        sa.Column("device_info", sa.String(500), nullable=True),
        sa.Column("ip_address", sa.String(50), nullable=True),
        sa.Column("is_active", sa.Boolean, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )

    # --- login_history ---
    op.create_table(
        "login_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("ip_address", sa.String(50), nullable=True),
        sa.Column("user_agent", sa.String(500), nullable=True),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- projects ---
    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("status", sa.String(50), server_default="planning"),
        sa.Column("priority", sa.String(50), server_default="medium"),
        sa.Column("progress", sa.Integer, server_default=sa.text("0")),
        sa.Column("color", sa.String(20), server_default="#3B82F6"),
        sa.Column("pinned", sa.Boolean, server_default=sa.text("false")),
        sa.Column("favorite", sa.Boolean, server_default=sa.text("false")),
        sa.Column("archived", sa.Boolean, server_default=sa.text("false")),
        sa.Column("project_type", sa.String(100), nullable=True),
        sa.Column("modules", postgresql.JSON, server_default=sa.text("'[]'::jsonb")),
        sa.Column("tags", postgresql.JSON, server_default=sa.text("'[]'::jsonb")),
        sa.Column("client", sa.String(255), nullable=True),
        sa.Column("technology_stack", sa.Text, nullable=True),
        sa.Column("target_urls", sa.Text, nullable=True),
        sa.Column("repository", sa.String(500), nullable=True),
        sa.Column("programming_language", sa.String(100), nullable=True),
        sa.Column("framework", sa.String(100), nullable=True),
        sa.Column("scope", sa.Text, nullable=True),
        sa.Column("rules_of_engagement", sa.Text, nullable=True),
        sa.Column("objectives", sa.Text, nullable=True),
        sa.Column("testing_window", sa.String(100), nullable=True),
        sa.Column("risk_level", sa.String(50), nullable=True),
        sa.Column("settings", postgresql.JSON, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # --- workspace_files ---
    op.create_table(
        "workspace_files",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id"), nullable=True),
        sa.Column("parent_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspace_files.id"), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("path", sa.Text, nullable=False),
        sa.Column("file_type", sa.String(50), nullable=True),
        sa.Column("mime_type", sa.String(100), nullable=True),
        sa.Column("size", sa.Integer, server_default=sa.text("0")),
        sa.Column("content", sa.Text, nullable=True),
        sa.Column("is_folder", sa.Boolean, server_default=sa.text("false")),
        sa.Column("is_favorite", sa.Boolean, server_default=sa.text("false")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Index("ix_workspace_files_project_id", "project_id"),
    )

    # --- file_versions ---
    op.create_table(
        "file_versions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("file_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspace_files.id"), nullable=False),
        sa.Column("version_number", sa.Integer, nullable=False),
        sa.Column("content", sa.Text, nullable=True),
        sa.Column("size", sa.Integer, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- scans ---
    op.create_table(
        "scans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id"), nullable=True),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("scan_type", sa.String(100), nullable=False),
        sa.Column("target", sa.String(500), nullable=True),
        sa.Column("status", sa.String(50), server_default="queued"),
        sa.Column("progress", sa.Integer, server_default=sa.text("0")),
        sa.Column("config", postgresql.JSON, server_default=sa.text("'{}'::jsonb")),
        sa.Column("result_summary", postgresql.JSON, server_default=sa.text("'{}'::jsonb")),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Index("ix_scans_project_id_status", "project_id", "status"),
    )

    # --- findings ---
    op.create_table(
        "findings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id"), nullable=True),
        sa.Column("scan_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("scans.id"), nullable=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("severity", sa.String(50), nullable=False),
        sa.Column("confidence", sa.String(50), nullable=True),
        sa.Column("status", sa.String(50), server_default="open"),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("affected_file", sa.String(500), nullable=True),
        sa.Column("affected_resource", sa.String(500), nullable=True),
        sa.Column("line_number", sa.Integer, nullable=True),
        sa.Column("evidence", sa.Text, nullable=True),
        sa.Column("technical_explanation", sa.Text, nullable=True),
        sa.Column("remediation", sa.Text, nullable=True),
        sa.Column("cve_id", sa.String(50), nullable=True),
        sa.Column("cvss_score", sa.Float, nullable=True),
        sa.Column("cwe_id", sa.String(50), nullable=True),
        sa.Column("owasp_category", sa.String(50), nullable=True),
        sa.Column("analyzer", sa.String(100), nullable=True),
        sa.Column("tags", postgresql.JSON, server_default=sa.text("'[]'::jsonb")),
        sa.Column("comments", postgresql.JSON, server_default=sa.text("'[]'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Index("ix_findings_project_id_severity", "project_id", "severity"),
    )

    # --- notifications ---
    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("message", sa.Text, nullable=True),
        sa.Column("notification_type", sa.String(50), server_default="info"),
        sa.Column("category", sa.String(50), server_default="system"),
        sa.Column("read", sa.Boolean, server_default=sa.text("false")),
        sa.Column("data", postgresql.JSON, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Index("ix_notifications_user_id_read", "user_id", "read"),
    )

    # --- audit_logs ---
    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("resource_type", sa.String(100), nullable=True),
        sa.Column("resource_id", sa.String(100), nullable=True),
        sa.Column("metadata", postgresql.JSON, server_default=sa.text("'{}'::jsonb")),
        sa.Column("ip_address", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Index("ix_audit_logs_user_id_created_at", "user_id", "created_at"),
    )

    # --- terminal_sessions ---
    op.create_table(
        "terminal_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String(100), nullable=True),
        sa.Column("shell", sa.String(50), server_default="/bin/bash"),
        sa.Column("is_active", sa.Boolean, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
    )

    # --- terminal_commands ---
    op.create_table(
        "terminal_commands",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("terminal_sessions.id"), nullable=False),
        sa.Column("command", sa.Text, nullable=False),
        sa.Column("output", sa.Text, nullable=True),
        sa.Column("exit_code", sa.Integer, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )

    # --- he_environments ---
    op.create_table(
        "he_environments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("env_type", sa.String(100), nullable=False),
        sa.Column("status", sa.String(50), server_default="creating"),
        sa.Column("container_id", sa.String(255), nullable=True),
        sa.Column("container_image", sa.String(255), nullable=True),
        sa.Column("resource_limits", postgresql.JSON, server_default=sa.text("'{}'::jsonb")),
        sa.Column("authorization_confirmed", sa.Boolean, server_default=sa.text("false")),
        sa.Column("authorization_notes", sa.Text, nullable=True),
        sa.Column("target", sa.String(500), nullable=True),
        sa.Column("ports", postgresql.JSON, server_default=sa.text("'[]'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("stopped_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Index("ix_he_environments_owner_id", "owner_id"),
    )

    # --- he_snapshots ---
    op.create_table(
        "he_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("environment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("he_environments.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("snapshot_data", postgresql.JSON, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Index("ix_he_snapshots_environment_id", "environment_id"),
    )


def downgrade() -> None:
    op.drop_table("he_snapshots")
    op.drop_table("he_environments")
    op.drop_table("terminal_commands")
    op.drop_table("terminal_sessions")
    op.drop_table("audit_logs")
    op.drop_table("notifications")
    op.drop_table("findings")
    op.drop_table("scans")
    op.drop_table("file_versions")
    op.drop_table("workspace_files")
    op.drop_table("projects")
    op.drop_table("login_history")
    op.drop_table("user_sessions")
    op.drop_table("user_profiles")
    op.drop_table("users")

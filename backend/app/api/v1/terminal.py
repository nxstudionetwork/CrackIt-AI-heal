from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID, uuid4
from datetime import datetime, timezone
import subprocess
import os
import re

from app.core.database import get_db, async_session
from app.api.deps import get_current_user
from app.core.security import decode_token
from app.core.config import settings
from app.models.user import User
from app.models.terminal import TerminalSession, TerminalCommand
from app.models.project import Project

router = APIRouter()

DANGEROUS_PATTERNS = [
    r"\brm\s+-rf\s+/\b",
    r"\bmkfs\b",
    r"\bdd\s+",
    r"\bformat\b",
    r"\b:(){ :\|:& };:\b",
    r"\bshutdown\b",
    r"\breboot\b",
    r"\bhalt\b",
    r"\binit\s+0\b",
    r"\binit\s+6\b",
    r"\bchmod\s+-R\s+777\s+/\b",
    r"\bchown\s+-R\b.*/\b",
    r">\s*/dev/sd[a-z]",
]


def is_dangerous_command(command: str) -> bool:
    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            return True
    return False


@router.get("/sessions")
async def list_sessions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TerminalSession)
        .where(TerminalSession.user_id == user.id)
        .order_by(TerminalSession.created_at.desc())
    )
    sessions = result.scalars().all()
    return {
        "sessions": [
            {
                "id": str(s.id),
                "project_id": str(s.project_id) if s.project_id else None,
                "name": s.name,
                "shell": s.shell,
                "is_active": s.is_active,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "closed_at": s.closed_at.isoformat() if s.closed_at else None,
            }
            for s in sessions
        ]
    }


@router.websocket("/ws/{session_id}")
async def websocket_terminal(
    websocket: WebSocket,
    session_id: str,
    token: str = Query(None),
    project_id: str = Query(None),
):
    if not token:
        await websocket.close(code=4001, reason="Authentication required")
        return

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        await websocket.close(code=4001, reason="Invalid token")
        return

    user_id = payload.get("sub")
    if not user_id:
        await websocket.close(code=4001, reason="Invalid token payload")
        return

    async with async_session() as db:
        result = await db.execute(select(User).where(User.id == UUID(user_id)))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            await websocket.close(code=4001, reason="User not found or inactive")
            return

        # Verify project access if project_id provided
        workspace_dir = None
        if project_id:
            proj_result = await db.execute(
                select(Project).where(
                    Project.id == UUID(project_id),
                    Project.owner_id == user.id,
                    Project.deleted_at.is_(None),
                )
            )
            project = proj_result.scalar_one_or_none()
            if project:
                workspace_dir = os.path.join(settings.WORKSPACE_ROOT, str(project.id))
                os.makedirs(workspace_dir, exist_ok=True)

        # Create terminal session record
        shell = "cmd" if os.name == "nt" else "/bin/bash"
        terminal_session = TerminalSession(
            id=UUID(session_id) if len(session_id) == 36 else None,
            user_id=user.id,
            project_id=UUID(project_id) if project_id else None,
            name=f"Terminal {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}",
            shell=shell,
            is_active=True,
        )
        if not terminal_session.id:
            terminal_session.id = uuid4()
        db.add(terminal_session)
        await db.commit()
        await db.refresh(terminal_session)

    await websocket.accept()

    if not workspace_dir:
        workspace_dir = settings.WORKSPACE_ROOT if os.path.exists(settings.WORKSPACE_ROOT) else os.getcwd()

    try:
        while True:
            data = await websocket.receive_text()

            if is_dangerous_command(data):
                await websocket.send_json({
                    "type": "error",
                    "data": "Command blocked: potentially dangerous operation detected.",
                    "exit_code": 1,
                })
                continue

            exit_code = 1
            output = ""
            try:
                if os.name == "nt":
                    proc = subprocess.Popen(
                        ["cmd", "/c", data],
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        stdin=subprocess.PIPE,
                        cwd=workspace_dir,
                        text=True,
                        timeout=30,
                    )
                else:
                    proc = subprocess.Popen(
                        ["/bin/bash", "-c", data],
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        stdin=subprocess.PIPE,
                        cwd=workspace_dir,
                        text=True,
                        timeout=30,
                    )
                stdout, stderr = proc.communicate(timeout=30)
                exit_code = proc.returncode
                output = stdout + stderr
            except subprocess.TimeoutExpired:
                proc.kill()
                output = "Command timed out after 30 seconds."
            except Exception as e:
                output = f"Error executing command: {str(e)}"

            await websocket.send_json({
                "type": "output",
                "data": output,
                "exit_code": exit_code,
            })

            # Log command to DB
            try:
                async with async_session() as db:
                    cmd_record = TerminalCommand(
                        session_id=terminal_session.id,
                        command=data,
                        output=output[:10000] if output else None,
                        exit_code=exit_code,
                        completed_at=datetime.now(timezone.utc),
                    )
                    db.add(cmd_record)
                    await db.commit()
            except Exception:
                pass

    except WebSocketDisconnect:
        # Mark session as closed
        try:
            async with async_session() as db:
                result = await db.execute(
                    select(TerminalSession).where(TerminalSession.id == terminal_session.id)
                )
                sess = result.scalar_one_or_none()
                if sess:
                    sess.is_active = False
                    sess.closed_at = datetime.now(timezone.utc)
                    await db.commit()
        except Exception:
            pass

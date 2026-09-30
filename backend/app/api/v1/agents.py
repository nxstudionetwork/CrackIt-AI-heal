"""AI Agent API endpoints."""
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.core.database import get_db, async_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.agent import Agent, AgentRun, AgentStep, AgentApproval, AgentTool
from app.services.agent_service import AgentService, TOOL_REGISTRY
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class RunCreate(BaseModel):
    agent_id: str
    project_id: Optional[str] = None
    model: Optional[str] = None

class ApprovalDecision(BaseModel):
    decision: str

@router.get("")
async def list_agents(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).where(Agent.is_enabled == True))
    agents = result.scalars().all()
    return [{"id": str(a.id), "name": a.name, "description": a.description, "allowed_tools": a.allowed_tools, "default_model": a.default_model, "is_builtin": a.is_builtin} for a in agents]

@router.get("/tools")
async def list_tools(user: User = Depends(get_current_user)):
    return list(TOOL_REGISTRY.values())

@router.post("/runs")
async def create_run(body: RunCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        run = await AgentService.create_run(db, UUID(body.agent_id), user.id, UUID(body.project_id) if body.project_id else None, body.model)
        asyncio.create_task(AgentService.execute_run(run.id, async_session))
        return {"id": str(run.id), "status": run.status}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/runs")
async def list_runs(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AgentRun).where(AgentRun.user_id == user.id).order_by(AgentRun.created_at.desc()).limit(50))
    runs = result.scalars().all()
    return [{"id": str(r.id), "agent_id": str(r.agent_id), "status": r.status, "current_step": r.current_step, "max_steps": r.max_steps, "result_summary": r.result_summary, "created_at": str(r.created_at)} for r in runs]

@router.get("/runs/{run_id}")
async def get_run(run_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AgentRun).where(AgentRun.id == UUID(run_id), AgentRun.user_id == user.id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    result = await db.execute(select(AgentStep).where(AgentStep.run_id == run.id).order_by(AgentStep.step_number))
    steps = result.scalars().all()

    return {
        "id": str(run.id), "agent_id": str(run.agent_id), "status": run.status,
        "current_step": run.current_step, "max_steps": run.max_steps,
        "result_summary": run.result_summary, "error_message": run.error_message,
        "started_at": str(run.started_at) if run.started_at else None,
        "completed_at": str(run.completed_at) if run.completed_at else None,
        "steps": [{"step_number": s.step_number, "step_type": s.step_type, "tool_used": s.tool_used, "output_summary": s.output_summary, "status": s.status} for s in steps]
    }

@router.post("/runs/{run_id}/cancel")
async def cancel_run(run_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    success = await AgentService.cancel_run(UUID(run_id), db)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot cancel run")
    return {"status": "cancelled"}

@router.get("/approvals")
async def list_pending_approvals(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AgentApproval).where(AgentApproval.user_id == user.id, AgentApproval.status == "pending")
    )
    approvals = result.scalars().all()
    return [{"id": str(a.id), "run_id": str(a.run_id), "action_description": a.action_description, "affected_files": a.affected_files, "created_at": str(a.created_at)} for a in approvals]

@router.post("/approvals/{approval_id}")
async def decide_approval(approval_id: str, body: ApprovalDecision, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AgentApproval).where(AgentApproval.id == UUID(approval_id), AgentApproval.user_id == user.id))
    approval = result.scalar_one_or_none()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    approval.status = body.decision
    approval.decided_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": approval.status}

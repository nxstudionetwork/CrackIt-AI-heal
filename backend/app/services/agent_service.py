"""AI Agent Service — Runtime engine for AI agents."""
import asyncio
import json
import logging
from datetime import datetime, timezone
from uuid import UUID, uuid4
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.agent import Agent, AgentRun, AgentStep, AgentApproval, AgentTool
from app.services.ai_service import ai_chat, AIServiceError

logger = logging.getLogger(__name__)

# Registered tools registry
TOOL_REGISTRY = {
    "project.list_files": {
        "id": "project.list_files",
        "name": "List Project Files",
        "description": "List files in the current project",
        "permission": "read_only",
    },
    "file.read": {
        "id": "file.read",
        "name": "Read File",
        "description": "Read the contents of a project file",
        "permission": "read_only",
    },
    "file.read_range": {
        "id": "file.read_range",
        "name": "Read File Range",
        "description": "Read specific lines from a file",
        "permission": "read_only",
    },
    "finding.read": {
        "id": "finding.read",
        "name": "Read Finding",
        "description": "Read a security finding",
        "permission": "read_only",
    },
    "finding.create_draft": {
        "id": "finding.create_draft",
        "name": "Create Draft Finding",
        "description": "Create a draft security finding",
        "permission": "read_only",
    },
    "scan.read": {
        "id": "scan.read",
        "name": "Read Scan Results",
        "description": "Read scan results",
        "permission": "read_only",
    },
    "code.search": {
        "id": "code.search",
        "name": "Search Code",
        "description": "Search for patterns in project code",
        "permission": "read_only",
    },
    "patch.prepare": {
        "id": "patch.prepare",
        "name": "Prepare Patch",
        "description": "Prepare a proposed code change",
        "permission": "approval_required",
    },
}

# Built-in agent definitions
BUILTIN_AGENTS = [
    {
        "name": "Code Review Agent",
        "description": "Analyzes source code for security vulnerabilities and best practices",
        "system_instructions": """You are a security-focused code reviewer. Analyze the provided code for:
1. Security vulnerabilities (OWASP Top 10)
2. Authentication/authorization issues
3. Input validation gaps
4. Cryptographic misuse
5. Secret exposure
6. Code quality issues

For each issue found, provide:
- Title
- Severity (critical/high/medium/low/info)
- Description
- Affected code location
- Remediation suggestion

Be thorough but avoid false positives. Focus on real security risks.""",
        "allowed_tools": ["project.list_files", "file.read", "file.read_range", "code.search", "finding.create_draft"],
        "default_model": "gpt-4",
        "max_steps": 15,
    },
    {
        "name": "Vulnerability Analysis Agent",
        "description": "Reviews project source and scan results for vulnerabilities",
        "system_instructions": """You are a vulnerability analyst. Review the provided code and scan results to identify security vulnerabilities. Correlate findings across different parts of the codebase. Create structured vulnerability reports with clear severity ratings and remediation steps.""",
        "allowed_tools": ["project.list_files", "file.read", "finding.read", "finding.create_draft", "scan.read"],
        "default_model": "gpt-4",
        "max_steps": 20,
    },
    {
        "name": "Bug Finder Agent",
        "description": "Finds code defects and logic errors",
        "system_instructions": """You are a bug hunter. Analyze code for:
1. Logic errors
2. Edge cases
3. Race conditions
4. Memory issues
5. Error handling gaps
6. Null/undefined references
Provide clear descriptions of each bug with reproduction steps when possible.""",
        "allowed_tools": ["project.list_files", "file.read", "file.read_range", "code.search"],
        "default_model": "gpt-4",
        "max_steps": 15,
    },
    {
        "name": "Fix Agent",
        "description": "Prepares code fixes for identified issues",
        "system_instructions": """You are a code fixer. Given a described issue, read the affected code and prepare a proposed fix. Show the exact changes needed. Always require approval before making changes.""",
        "allowed_tools": ["project.list_files", "file.read", "file.read_range", "patch.prepare"],
        "default_model": "gpt-4",
        "max_steps": 10,
    },
    {
        "name": "Test Agent",
        "description": "Analyzes and suggests test cases for code",
        "system_instructions": """You are a test engineer. Analyze code and suggest comprehensive test cases. Identify untested code paths, edge cases, and boundary conditions.""",
        "allowed_tools": ["project.list_files", "file.read", "code.search"],
        "default_model": "gpt-4",
        "max_steps": 10,
    },
    {
        "name": "Project Architect Agent",
        "description": "Understands and documents project architecture",
        "system_instructions": """You are a software architect. Analyze the project structure, identify components, map data flows, and document the architecture. Identify architectural issues and improvement opportunities.""",
        "allowed_tools": ["project.list_files", "file.read", "code.search"],
        "default_model": "gpt-4",
        "max_steps": 15,
    },
    {
        "name": "Finding Remediation Agent",
        "description": "Creates remediation plans for security findings",
        "system_instructions": """You are a remediation specialist. Given a security finding, read the affected code, explain the risk in detail, and create a step-by-step remediation plan with code examples.""",
        "allowed_tools": ["file.read", "finding.read", "code.search", "patch.prepare"],
        "default_model": "gpt-4",
        "max_steps": 10,
    },
    {
        "name": "HE Assistant Agent",
        "description": "Assists with authorized security testing environments",
        "system_instructions": """You are a security testing assistant. Help the user with authorized security testing. Suggest investigation steps, explain command output, and guide through defensive analysis techniques. Never execute commands without explicit approval.""",
        "allowed_tools": ["file.read", "finding.read"],
        "default_model": "gpt-4",
        "max_steps": 20,
    },
]


class AgentService:
    """Runtime engine for AI agents."""

    @staticmethod
    async def initialize_builtin_agents(db: AsyncSession):
        """Create built-in agents if they don't exist."""
        for agent_def in BUILTIN_AGENTS:
            result = await db.execute(select(Agent).where(Agent.name == agent_def["name"]))
            if not result.scalar_one_or_none():
                agent = Agent(
                    name=agent_def["name"],
                    description=agent_def["description"],
                    system_instructions=agent_def["system_instructions"],
                    allowed_tools=agent_def["allowed_tools"],
                    default_model=agent_def["default_model"],
                    max_steps=agent_def["max_steps"],
                    is_builtin=True,
                )
                db.add(agent)
        await db.commit()

    @staticmethod
    async def initialize_tool_registry(db: AsyncSession):
        """Create tool registry entries."""
        for tool_id, tool_def in TOOL_REGISTRY.items():
            result = await db.execute(select(AgentTool).where(AgentTool.tool_id == tool_id))
            if not result.scalar_one_or_none():
                tool = AgentTool(
                    tool_id=tool_id,
                    name=tool_def["name"],
                    description=tool_def["description"],
                    permission_level=tool_def["permission"],
                )
                db.add(tool)
        await db.commit()

    @staticmethod
    async def create_run(db: AsyncSession, agent_id: UUID, user_id: UUID, project_id: UUID = None, model: str = None) -> AgentRun:
        """Create a new agent run."""
        result = await db.execute(select(Agent).where(Agent.id == agent_id))
        agent = result.scalar_one_or_none()
        if not agent:
            raise ValueError("Agent not found")

        run = AgentRun(
            agent_id=agent_id,
            user_id=user_id,
            project_id=project_id,
            model=model or agent.default_model,
            status="queued",
            max_steps=agent.max_steps,
        )
        db.add(run)
        await db.commit()
        await db.refresh(run)
        return run

    @staticmethod
    async def execute_run(run_id: UUID, db_factory, user_context: dict = None):
        """Execute an agent run asynchronously."""
        async with db_factory() as db:
            result = await db.execute(select(AgentRun).where(AgentRun.id == run_id))
            run = result.scalar_one_or_none()
            if not run:
                return

            result = await db.execute(select(Agent).where(Agent.id == run.agent_id))
            agent = result.scalar_one_or_none()
            if not agent:
                return

            # Mark as running
            run.status = "running"
            run.started_at = datetime.now(timezone.utc)
            await db.commit()

            try:
                messages = [
                    {"role": "system", "content": agent.system_instructions},
                    {"role": "user", "content": f"Analyze the project and provide your findings. Agent: {agent.name}"}
                ]

                step_num = 0
                max_steps = run.max_steps or 20

                while step_num < max_steps:
                    step_num += 1
                    run.current_step = step_num
                    await db.commit()

                    response = await ai_chat(messages, model=run.model)
                    ai_response = response.get("response", "")

                    # Record step
                    step = AgentStep(
                        run_id=run.id,
                        step_number=step_num,
                        step_type="thinking",
                        input_summary=f"Step {step_num}",
                        output_summary=ai_response[:500],
                        status="completed",
                    )
                    db.add(step)

                    # Check if the agent wants to use a tool
                    if "[TOOL:" in ai_response:
                        tool_match = ai_response.split("[TOOL:")[1].split("]")[0].strip()
                        tool_result = await AgentService._execute_tool(tool_match, run, db, user_context)
                        step.tool_used = tool_match
                        step.output_summary = f"Tool result: {tool_result[:300]}" if tool_result else "No result"
                        messages.append({"role": "assistant", "content": ai_response})
                        messages.append({"role": "user", "content": f"Tool result: {tool_result}"})
                    else:
                        # Agent is done
                        run.status = "completed"
                        run.result_summary = ai_response[:2000]
                        run.completed_at = datetime.now(timezone.utc)
                        step.step_type = "result"
                        await db.commit()
                        return

                # Max steps reached
                run.status = "completed"
                run.result_summary = f"Completed {step_num} steps. Results recorded."
                run.completed_at = datetime.now(timezone.utc)
                await db.commit()

            except AIServiceError as e:
                run.status = "failed"
                run.error_message = f"{e.code}: {e.message}"
                run.completed_at = datetime.now(timezone.utc)
                await db.commit()
            except Exception as e:
                run.status = "failed"
                run.error_message = str(e)[:500]
                run.completed_at = datetime.now(timezone.utc)
                await db.commit()
                logger.error(f"Agent run {run_id} failed: {e}")

    @staticmethod
    async def _execute_tool(tool_call: str, run: AgentRun, db: AsyncSession, user_context: dict = None) -> str:
        """Execute a registered tool and return results."""
        parts = tool_call.split(":", 1)
        tool_id = parts[0].strip()
        tool_input = parts[1].strip() if len(parts) > 1 else ""

        if tool_id not in TOOL_REGISTRY:
            return f"Unknown tool: {tool_id}"

        tool_info = TOOL_REGISTRY[tool_id]

        if tool_info["permission"] == "approval_required":
            return f"APPROVAL_REQUIRED: Tool '{tool_info['name']}' requires user approval."

        if tool_id == "project.list_files":
            from app.models.project import WorkspaceFile
            result = await db.execute(
                select(WorkspaceFile).where(WorkspaceFile.project_id == run.project_id, WorkspaceFile.deleted_at.is_(None))
            )
            files = result.scalars().all()
            return "\n".join([f"{f.name} ({f.file_type})" for f in files]) or "No files found"

        elif tool_id == "file.read":
            from app.models.project import WorkspaceFile
            result = await db.execute(
                select(WorkspaceFile).where(WorkspaceFile.name == tool_input, WorkspaceFile.project_id == run.project_id)
            )
            file = result.scalar_one_or_none()
            if file:
                return file.content or "(empty file)"
            return f"File not found: {tool_input}"

        elif tool_id == "code.search":
            from app.models.project import WorkspaceFile
            result = await db.execute(
                select(WorkspaceFile).where(
                    WorkspaceFile.project_id == run.project_id,
                    WorkspaceFile.content.ilike(f"%{tool_input}%"),
                    WorkspaceFile.deleted_at.is_(None)
                )
            )
            files = result.scalars().all()
            return f"Found {len(files)} files containing '{tool_input}'" if files else "No matches found"

        elif tool_id == "finding.create_draft":
            return f"Draft finding created: {tool_input}"

        return f"Tool '{tool_id}' executed"

    @staticmethod
    async def cancel_run(run_id: UUID, db: AsyncSession) -> bool:
        """Cancel a running agent."""
        result = await db.execute(select(AgentRun).where(AgentRun.id == run_id))
        run = result.scalar_one_or_none()
        if not run or run.status not in ("queued", "running", "waiting_for_approval"):
            return False
        run.status = "cancelled"
        run.completed_at = datetime.now(timezone.utc)
        await db.commit()
        return True

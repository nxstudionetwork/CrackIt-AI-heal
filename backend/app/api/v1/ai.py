from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.core.config import settings
from app.services.ai_service import ai_chat, AIServiceError

router = APIRouter()


class AIAnalyzeRequest(BaseModel):
    content: str
    analysis_type: str = "general"
    context: Optional[str] = None


class AIExplainRequest(BaseModel):
    code: str
    language: Optional[str] = None


class AICodeReviewRequest(BaseModel):
    code: str
    language: Optional[str] = None
    project_id: Optional[str] = None


class AIFindingsReportRequest(BaseModel):
    findings: List[dict]
    format: str = "markdown"


async def call_ai(prompt: str, system_prompt: str = "") -> str:
    """Call the configured AI provider via the gateway."""
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    try:
        result = await ai_chat(messages)
    except AIServiceError as e:
        status_map = {
            "AI_PROVIDER_NOT_CONFIGURED": 503,
            "AI_RATE_LIMITED": 429,
            "AI_PROVIDER_AUTH_FAILED": 401,
        }
        raise HTTPException(status_code=status_map.get(e.code, 502), detail=e.message)

    return result["response"]


@router.get("/models")
async def list_models():
    """List available AI models based on configured providers."""
    models = []
    if settings.AI_API_KEY:
        if settings.AI_PROVIDER == "openai":
            models.append({"id": "gpt-4", "provider": "openai", "name": "GPT-4", "enabled": True})
            models.append({"id": "gpt-3.5-turbo", "provider": "openai", "name": "GPT-3.5 Turbo", "enabled": True})
        elif settings.AI_PROVIDER == "anthropic":
            models.append({"id": "claude-sonnet-4-20250514", "provider": "anthropic", "name": "Claude Sonnet", "enabled": True})
    models.append({"id": "ollama-local", "provider": "ollama", "name": "Local Ollama", "enabled": True})
    return models


@router.post("/analyze")
async def analyze_code(
    data: AIAnalyzeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    system = (
        "You are a senior security engineer. Analyze the provided code or text "
        "for security vulnerabilities, code quality issues, and potential risks. "
        "Provide findings with severity levels (critical, high, medium, low, info) "
        "and actionable remediation advice."
    )

    prompt = f"Analysis type: {data.analysis_type}\n\nContent:\n{data.content}"
    if data.context:
        prompt += f"\n\nAdditional context:\n{data.context}"

    result = await call_ai(prompt, system)
    return {"analysis": result, "analysis_type": data.analysis_type}


@router.post("/explain")
async def explain_code(
    data: AIExplainRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    system = (
        "You are a security expert and code analyst. Explain the provided code "
        "in detail, including its purpose, how it works, potential security "
        "implications, and any notable patterns or anti-patterns."
    )

    prompt = f"Language: {data.language or 'auto-detect'}\n\nCode:\n{data.code}"
    result = await call_ai(prompt, system)
    return {"explanation": result}


@router.post("/code-review")
async def code_review(
    data: AICodeReviewRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    system = (
        "You are a senior application security engineer performing a code review. "
        "Review the code for security vulnerabilities following OWASP Top 10 and "
        "CWE/SANS Top 25. For each finding, provide: title, severity, description, "
        "affected line references if applicable, evidence, and remediation steps."
    )

    prompt = f"Language: {data.language or 'auto-detect'}\n\nCode to review:\n{data.code}"
    result = await call_ai(prompt, system)
    return {"review": result}


@router.post("/generate-report")
async def generate_report(
    data: AIFindingsReportRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    system = (
        "You are a penetration testing report writer. Generate a professional "
        "security assessment report based on the provided findings. Include "
        "an executive summary, methodology, detailed findings with risk ratings, "
        "and remediation recommendations."
    )

    findings_text = "\n\n".join(
        [f"Finding {i+1}: {f.get('title', 'N/A')}\nSeverity: {f.get('severity', 'N/A')}\nDescription: {f.get('description', 'N/A')}" for i, f in enumerate(data.findings)]
    )
    prompt = f"Generate a {data.format} security assessment report for the following findings:\n\n{findings_text}"
    result = await call_ai(prompt, system)
    return {"report": result, "format": data.format}


@router.post("/suggest-remediation")
async def suggest_remediation(
    finding_description: str,
    code_snippet: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    system = (
        "You are a security remediation expert. Provide detailed, actionable "
        "remediation steps for the described vulnerability. Include code examples "
        "for fixes where applicable. Consider both immediate fixes and long-term "
        "prevention strategies."
    )

    prompt = f"Vulnerability:\n{finding_description}"
    if code_snippet:
        prompt += f"\n\nAffected code:\n{code_snippet}"

    result = await call_ai(prompt, system)
    return {"remediation": result}


@router.get("/health")
async def ai_health(
    user: User = Depends(get_current_user),
):
    configured = bool(settings.AI_API_KEY)
    return {
        "configured": configured,
        "provider": settings.AI_PROVIDER,
        "model": settings.AI_MODEL if configured else None,
    }

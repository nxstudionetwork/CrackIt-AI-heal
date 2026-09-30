from fastapi import APIRouter
from app.api.v1 import auth, users, projects, files, findings, notifications, terminal, scans, he, ai, audit, health, agents, notes, clients

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(files.router, prefix="/files", tags=["Files"])
api_router.include_router(findings.router, prefix="/findings", tags=["Findings"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(notes.router, prefix="/notes", tags=["Notes"])
api_router.include_router(clients.router, prefix="/clients", tags=["Clients"])
api_router.include_router(terminal.router, prefix="/terminal", tags=["Terminal"])
api_router.include_router(scans.router, prefix="/scans", tags=["Scans"])
api_router.include_router(he.router, prefix="/he", tags=["Hacking Environment"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit Logs"])
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(agents.router, prefix="/agents", tags=["AI Agents"])

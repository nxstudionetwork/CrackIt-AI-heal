"""HE Service — Docker container lifecycle for hacking environments."""
import asyncio
import logging
from datetime import datetime, timezone
from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.he import HEEnvironment

logger = logging.getLogger(__name__)

class HEService:
    """Manages HE environments with real Docker containers when available."""

    DEFAULT_LIMITS = {"cpu": "1.0", "memory": "512m", "disk": "5g"}

    @staticmethod
    async def start_environment(env_id: UUID, db: AsyncSession) -> dict:
        result = await db.execute(select(HEEnvironment).where(HEEnvironment.id == env_id))
        env = result.scalar_one_or_none()
        if not env:
            raise ValueError("Environment not found")
        if env.status == "running":
            raise ValueError("Environment already running")

        container_id = await HEService._try_start_docker(env)

        env.status = "running"
        env.started_at = datetime.now(timezone.utc)
        if container_id:
            env.container_id = container_id
        await db.commit()

        return {"status": "running", "container_id": container_id}

    @staticmethod
    async def stop_environment(env_id: UUID, db: AsyncSession) -> dict:
        result = await db.execute(select(HEEnvironment).where(HEEnvironment.id == env_id))
        env = result.scalar_one_or_none()
        if not env:
            raise ValueError("Environment not found")

        if env.container_id:
            await HEService._try_stop_docker(env.container_id)

        env.status = "stopped"
        env.stopped_at = datetime.now(timezone.utc)
        await db.commit()

        return {"status": "stopped"}

    @staticmethod
    async def _try_start_docker(env) -> Optional[str]:
        try:
            import docker
            client = docker.from_env()
            image = env.container_image or "kali-linux/kali-rolling"
            limits = env.resource_limits or HEService.DEFAULT_LIMITS

            container = client.containers.run(
                image,
                detach=True,
                name=f"he-{str(env.id)[:8]}",
                mem_limit=limits.get("memory", "512m"),
                cpu_quota=int(float(limits.get("cpu", "1.0")) * 100000),
                network_mode="bridge",
                labels={"crackit": "true", "env_id": str(env.id)},
            )
            return container.id[:12]
        except ImportError:
            logger.info("Docker SDK not installed — running in DB-only mode")
            return None
        except Exception as e:
            logger.warning(f"Docker start failed: {e} — running in DB-only mode")
            return None

    @staticmethod
    async def _try_stop_docker(container_id: str):
        try:
            import docker
            client = docker.from_env()
            container = client.containers.get(container_id)
            container.stop(timeout=10)
            container.remove(force=True)
        except Exception as e:
            logger.warning(f"Docker stop failed: {e}")

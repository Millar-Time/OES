"""FastAPI entry point for the OES agent service."""
from fastapi import FastAPI

from .config import settings
from .orchestrator import Mission, orchestrator

app = FastAPI(title="OES Agent Service", version="0.1.0")


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "environment": settings.environment}


@app.post("/api/missions")
async def create_mission(incident_id: str, goal: str) -> dict:
    """Placeholder mission endpoint — real routing lands in F4."""
    return await orchestrator.handle(Mission(incident_id=incident_id, goal=goal))

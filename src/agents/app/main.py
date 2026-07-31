"""FastAPI entry point for the OES agent service.

F4 surface — the deterministic COP backbone (US-01) the web shell renders:
  GET  /api/health      liveness + environment
  GET  /api/incident    fused Ridgeline Fire (US-01)
  GET  /api/resources   seeded inventory, filter by ?oa= &status=
  GET  /api/weather     NWS red-flag snapshot (US-03 seed)
  GET  /api/maps/token  short-lived Entra token for Azure Maps (managed identity)
  POST /api/missions    orchestrator entry (grows through Phase 2)
"""
from typing import Any

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from .config import settings
from .maps import get_maps_token
from .orchestrator import Mission, orchestrator

app = FastAPI(title="OES Agent Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "environment": settings.environment}


@app.get("/api/incident")
async def incident() -> dict[str, Any]:
    """US-01 — the fused common operating picture for the Ridgeline Fire."""
    return await orchestrator.common_operating_picture()


@app.get("/api/resources")
async def resources(
    oa: str | None = Query(default=None, description="Operational area, e.g. JUS"),
    status: str | None = Query(default=None, description="Availability status"),
) -> list[dict[str, Any]]:
    return await orchestrator.resources(oa=oa, status=status)


@app.get("/api/weather")
async def weather() -> dict[str, Any]:
    return await orchestrator.weather()


@app.get("/api/recommendation/initial")
async def initial_response() -> dict[str, Any]:
    """US-04 — recommended initial-attack package with ETAs and rationale."""
    return await orchestrator.initial_response()


@app.get("/api/orders")
async def orders() -> dict[str, Any]:
    """US-06/US-07 — ranked resource-order options with the drawdown guardrail."""
    return await orchestrator.orders()


@app.get("/api/drawdown")
async def drawdown(
    committed_ids: str | None = Query(default=None, description="Comma-separated resource ids"),
) -> dict[str, Any]:
    ids = [i for i in (committed_ids or "").split(",") if i]
    return await orchestrator.drawdown(committed_ids=ids)


class DecisionRequest(BaseModel):
    decision: str  # approve | override | modify
    option_name: str
    actor: str = "Tom Brills · OA Coordinator"
    note: str | None = None
    resources: list[str] | None = None


@app.post("/api/decisions")
async def create_decision(req: DecisionRequest) -> dict[str, Any]:
    """US-21 — log a human approve/override/modify to the decision-trace ledger."""
    return await orchestrator.record_decision(
        decision=req.decision,
        option_name=req.option_name,
        actor=req.actor,
        note=req.note,
        resources=req.resources,
    )


@app.get("/api/trace")
async def trace() -> dict[str, Any]:
    """US-24 — the ordered, tamper-evident decision-trace ledger."""
    return await orchestrator.trace()


class AssistantRequest(BaseModel):
    question: str


@app.post("/api/assistant")
async def assistant(req: AssistantRequest) -> dict[str, Any]:
    """US-18 — grounded conversational assistant over the live operating picture."""
    return await orchestrator.assistant(question=req.question)


@app.get("/api/maps/token")
async def maps_token() -> JSONResponse:
    result = get_maps_token()
    status_code = 200 if result.get("available") else 503
    return JSONResponse(status_code=status_code, content=result)


@app.post("/api/missions")
async def create_mission(incident_id: str = "", goal: str = "") -> dict:
    return await orchestrator.handle(Mission(incident_id=incident_id, goal=goal))

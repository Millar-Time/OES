"""Mission Orchestrator — coordinates specialist tools for the golden path.

F4 wiring: registers the tool suite and exposes high-level operations the API
calls. Microsoft Agent Framework model-reasoning steps (Decision Support,
Resource Recommendation) land in Phase 2; this provides the deterministic COP
foundation (US-01) they build on. Every operation is grounded in seeded data.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

# Importing the tool modules registers them on the shared registry.
from .tools import registry
from .tools import feeds as _feeds  # noqa: F401
from .tools import inventory as _inventory  # noqa: F401
from .tools import recommend as _recommend  # noqa: F401


@dataclass
class Mission:
    incident_id: str
    goal: str
    context: dict[str, Any] = field(default_factory=dict)


class MissionOrchestrator:
    def __init__(self) -> None:
        self.tools = registry

    async def common_operating_picture(self) -> dict[str, Any]:
        """US-01: the fused incident that anchors the demo."""
        return await self.tools.get("fuse_incident_feeds").run()

    async def resources(self, oa: str | None = None, status: str | None = None) -> list[dict[str, Any]]:
        return await self.tools.get("list_resources").run(oa=oa, status=status)

    async def weather(self) -> dict[str, Any]:
        return await self.tools.get("get_weather").run()

    async def initial_response(self) -> dict[str, Any]:
        """US-04: escalated initial-attack recommendation with rationale."""
        return await self.tools.get("recommend_initial_response").run()

    async def handle(self, mission: Mission) -> dict[str, Any]:
        cop = await self.common_operating_picture()
        return {
            "incident_id": mission.incident_id or cop["incident_id"],
            "goal": mission.goal,
            "cop": cop,
            "tools_available": self.tools.list(),
        }


orchestrator = MissionOrchestrator()

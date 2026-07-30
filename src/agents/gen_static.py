"""Generate static API snapshots for the Azure Static Web Apps demo.

The hosted demo (SWA Free tier) has no server compute, so we bake the read-only
US-01/03/04/11 responses to JSON that staticwebapp.config.json serves at the
real /api/* paths. Run from src/agents after changing tools or seed data:

    python gen_static.py
"""
import asyncio
import json
from pathlib import Path

from app.orchestrator import orchestrator

OUT = Path(__file__).resolve().parents[2] / "src" / "web" / "public" / "data"


async def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    snapshots = {
        "incident.json": await orchestrator.common_operating_picture(),
        "resources.json": await orchestrator.resources(),
        "weather.json": await orchestrator.weather(),
        "recommendation-initial.json": await orchestrator.initial_response(),
        "orders.json": await orchestrator.orders(),
    }
    for name, payload in snapshots.items():
        (OUT / name).write_text(json.dumps(payload, indent=2))
    print(f"Wrote {len(snapshots)} snapshots to {OUT}")


if __name__ == "__main__":
    asyncio.run(main())

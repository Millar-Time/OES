"""Resource inventory + weather tools over seeded data."""
from __future__ import annotations

from typing import Any

from ..data import resource_inventory, weather
from . import Tool, registry


class InventoryTool(Tool):
    name = "list_resources"
    description = "List seeded fire resources, optionally filtered by operational area or status."

    async def run(self, oa: str | None = None, status: str | None = None, **kwargs: Any) -> list[dict[str, Any]]:
        items = resource_inventory()
        if oa:
            items = [r for r in items if r["oa"] == oa]
        if status:
            items = [r for r in items if r["status"] == status]
        return items


class WeatherTool(Tool):
    name = "get_weather"
    description = "Return the seeded NWS-style weather + red-flag context for the incident."

    async def run(self, **kwargs: Any) -> dict[str, Any]:
        return weather()


registry.register(InventoryTool())
registry.register(WeatherTool())

"""US-07 — Drawdown guardrail.

Enforces per-operational-area minimum coverage. Given a set of resources being
committed to an incident, computes what each OA would have left and flags any
order that would drop an OA below its minimum available engines / hand crews.
This is the "system prevents an unsafe decision" moment.
"""
from __future__ import annotations

from typing import Any

from ..data import drawdown_minimums, resource_inventory
from . import Tool, registry

_COUNTED_TYPES = ("engine", "hand_crew")


def _available_by_oa() -> dict[str, dict[str, int]]:
    counts: dict[str, dict[str, int]] = {}
    for r in resource_inventory():
        if r["status"] != "available":
            continue
        counts.setdefault(r["oa"], {}).setdefault(r["type"], 0)
        counts[r["oa"]][r["type"]] += 1
    return counts


def assess(committed_ids: set[str]) -> dict[str, Any]:
    """Return per-OA remaining coverage vs minimums after committing the given ids."""
    inv = {r["id"]: r for r in resource_inventory()}
    available = _available_by_oa()

    # Subtract committed resources from their home OA availability.
    for rid in committed_ids:
        r = inv.get(rid)
        if not r or r["status"] != "available":
            continue
        if r["type"] in _COUNTED_TYPES:
            if r["oa"] in available and r["type"] in available[r["oa"]]:
                available[r["oa"]][r["type"]] -= 1

    rows: list[dict[str, Any]] = []
    any_breach = False
    for m in drawdown_minimums():
        oa = m["oa"]
        eng = available.get(oa, {}).get("engine", 0)
        hc = available.get(oa, {}).get("hand_crew", 0)
        eng_min = m["min_engines_available"]
        hc_min = m["min_hand_crews_available"]
        breach = eng < eng_min or hc < hc_min
        at_min = not breach and (eng == eng_min or hc == hc_min)
        status = "BREACH" if breach else ("AT_MIN" if at_min else "OK")
        any_breach = any_breach or breach
        rows.append({
            "oa": oa,
            "name": m["name"],
            "engines_remaining": eng,
            "min_engines": eng_min,
            "hand_crews_remaining": hc,
            "min_hand_crews": hc_min,
            "status": status,
        })
    return {"any_breach": any_breach, "areas": rows}


class DrawdownTool(Tool):
    name = "assess_drawdown"
    description = "Assess per-OA remaining coverage vs drawdown minimums for a committed set (US-07)."

    async def run(self, committed_ids: list[str] | None = None, **kwargs: Any) -> dict[str, Any]:
        return assess(set(committed_ids or []))


registry.register(DrawdownTool())

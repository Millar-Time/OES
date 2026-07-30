"""US-06 — Ranked resource-order options.

Produces two decision-guided options for filling the initial-attack package and
ranks them, running each through the US-07 drawdown guardrail:

  • "Fastest response" — closest units first, ignoring OA coverage.
  • "Protect OA coverage" — closest units that keep every OA at or above its
    drawdown minimum; underfilled types trigger an escalation recommendation.

Options that breach a drawdown minimum are ranked below those that don't, so the
safe order is recommended by default (but the human still chooses — US-21).
"""
from __future__ import annotations

from typing import Any

from ..data import drawdown_minimums, incident_feeds, resource_inventory, weather
from ..geo import eta_min, haversine_km, tier
from .drawdown import assess
from .feeds import fuse
from .recommend import _package
from . import Tool, registry

_COUNTED = ("engine", "hand_crew")


def _scored_by_type(incident: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    lat, lon = incident["centroid"]["lat"], incident["centroid"]["lon"]
    oa = incident["operational_area"]
    scored: dict[str, list[dict[str, Any]]] = {}
    for r in resource_inventory():
        if r["status"] != "available":
            continue
        km = haversine_km(lat, lon, r["lat"], r["lon"])
        scored.setdefault(r["type"], []).append({
            "id": r["id"],
            "type": r["type"],
            "home_unit": r["home_unit"],
            "oa": r["oa"],
            "tier": tier(r, oa),
            "distance_km": round(km, 1),
            "eta_min": eta_min(r, km),
        })
    for lst in scored.values():
        lst.sort(key=lambda x: x["eta_min"])
    return scored


def _minimums() -> dict[str, dict[str, int]]:
    return {
        m["oa"]: {"engine": m["min_engines_available"], "hand_crew": m["min_hand_crews_available"]}
        for m in drawdown_minimums()
    }


def _initial_available() -> dict[str, dict[str, int]]:
    counts: dict[str, dict[str, int]] = {}
    for r in resource_inventory():
        if r["status"] != "available":
            continue
        counts.setdefault(r["oa"], {}).setdefault(r["type"], 0)
        counts[r["oa"]][r["type"]] += 1
    return counts


def _select(scored: dict[str, list[dict[str, Any]]], pkg: dict[str, int], respect_drawdown: bool) -> tuple[list, list]:
    mins = _minimums()
    remaining = _initial_available()
    assignments: list[dict[str, Any]] = []
    unfilled: list[dict[str, Any]] = []

    for rtype, count in pkg.items():
        need = count
        for cand in scored.get(rtype, []):
            if need == 0:
                break
            oa = cand["oa"]
            if respect_drawdown and rtype in _COUNTED:
                floor = mins.get(oa, {}).get(rtype)
                if floor is not None and remaining.get(oa, {}).get(rtype, 0) - 1 < floor:
                    continue  # skip to protect this OA's minimum coverage
            assignments.append(cand)
            if rtype in _COUNTED and oa in remaining and rtype in remaining[oa]:
                remaining[oa][rtype] -= 1
            need -= 1
        if need > 0:
            unfilled.append({"type": rtype, "requested": count, "filled": count - need})
    return assignments, unfilled


def _build_option(name: str, strategy: str, scored, pkg, respect_drawdown: bool) -> dict[str, Any]:
    assignments, unfilled = _select(scored, pkg, respect_drawdown)
    committed_ids = {a["id"] for a in assignments}
    dd = assess(committed_ids)
    etas = [a["eta_min"] for a in assignments] or [0]
    return {
        "name": name,
        "strategy": strategy,
        "assignments": assignments,
        "unfilled": unfilled,
        "max_eta_min": max(etas),
        "avg_eta_min": round(sum(etas) / len(etas)),
        "drawdown": dd,
        "escalation_recommended": bool(unfilled),
    }


def rank_orders() -> dict[str, Any]:
    raw = incident_feeds()
    incident = fuse(raw["feeds"], raw["fused"])
    wx = weather()
    pkg = _package(incident, wx)
    scored = _scored_by_type(incident)

    fastest = _build_option(
        "Fastest response", "Closest available units first, ignoring OA coverage.",
        scored, pkg, respect_drawdown=False,
    )
    protect = _build_option(
        "Protect OA coverage", "Closest units that keep every OA at or above its drawdown minimum.",
        scored, pkg, respect_drawdown=True,
    )

    # Rank: no drawdown breach first, then lower average ETA.
    options = [fastest, protect]
    options.sort(key=lambda o: (o["drawdown"]["any_breach"], o["avg_eta_min"]))
    for i, o in enumerate(options):
        o["rank"] = i + 1
        o["recommended"] = i == 0

    rec = options[0]
    if rec["escalation_recommended"]:
        rationale = (
            f"The fastest order would breach Justice County's drawdown minimum. The recommended "
            f"'{rec['name']}' order protects OA coverage but can only fill "
            f"{len(rec['assignments'])} of {sum(pkg.values())} requested resources from local + "
            f"Region II — escalate to State mutual aid (US-10) for the remainder."
        )
    else:
        rationale = (
            f"The recommended '{rec['name']}' order fills the package with an average ETA of "
            f"{rec['avg_eta_min']} min while keeping every OA at or above its drawdown minimum."
        )

    return {
        "incident_id": incident["incident_id"],
        "incident_name": incident["name"],
        "operational_area": incident["operational_area"],
        "requested_package": pkg,
        "options": options,
        "recommended_rationale": rationale,
    }


class OrdersTool(Tool):
    name = "rank_orders"
    description = "Rank resource-order options with the drawdown guardrail applied (US-06/US-07)."

    async def run(self, **kwargs: Any) -> dict[str, Any]:
        return rank_orders()


registry.register(OrdersTool())

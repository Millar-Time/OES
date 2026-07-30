"""US-04 — Initial Response: recommend an initial-attack package.

Turns the fused picture (US-01) + red-flag weather (US-03) + live inventory
(US-11) into a concrete, ranked initial-attack recommendation with an ETA and a
plain-language rationale for every assignment. This is the platform's first
"decision-guided, not data-dump" surface: it leads with the recommendation and
the *why* (feeding US-23 explainability), rather than making the coordinator
assemble the order by hand.

Deterministic for the demo (no model call): closest available resource of each
required type, grounded entirely in seeded data.
"""
from __future__ import annotations

import math
from typing import Any

from ..data import incident_feeds, resource_inventory, weather
from ..tools.feeds import fuse
from . import Tool, registry

# Rough travel speeds (km/h) used only to estimate ETA for the demo.
GROUND_SPEED_KMH = 55.0
AIR_SPEED_KMH = 220.0
AIR_TYPES = {"aircraft"}


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return r * 2 * math.asin(math.sqrt(a))


def _eta_min(resource: dict[str, Any], km: float) -> int:
    speed = AIR_SPEED_KMH if resource["type"] in AIR_TYPES else GROUND_SPEED_KMH
    travel = (km / speed) * 60.0
    return int(round(resource.get("readiness_min", 10) + travel))


def _tier(resource: dict[str, Any], incident_oa: str) -> str:
    if resource["oa"] == incident_oa:
        return "Operational Area"
    if resource["oa"] == "STATE":
        return "State (Cal OES)"
    return "Mutual Aid Region II"


def _package(incident: dict[str, Any], wx: dict[str, Any]) -> dict[str, int]:
    """Initial-attack composition, escalated for red-flag / extreme conditions."""
    pkg = {"engine": 3, "hand_crew": 1, "dozer": 1}
    red_flag = wx.get("red_flag_warning", {}).get("active", False)
    if red_flag or wx.get("escalation_risk") in ("high", "extreme"):
        pkg["engine"] = 4
        pkg["aircraft"] = 2
    return pkg


def recommend() -> dict[str, Any]:
    raw = incident_feeds()
    incident = fuse(raw["feeds"], raw["fused"])
    wx = weather()
    inventory = resource_inventory()

    lat, lon = incident["centroid"]["lat"], incident["centroid"]["lon"]
    oa = incident["operational_area"]
    pkg = _package(incident, wx)

    # Score every available resource by ETA to the incident.
    scored: dict[str, list[dict[str, Any]]] = {}
    for r in inventory:
        if r["status"] != "available":
            continue
        km = _haversine_km(lat, lon, r["lat"], r["lon"])
        scored.setdefault(r["type"], []).append({
            "id": r["id"],
            "type": r["type"],
            "home_unit": r["home_unit"],
            "oa": r["oa"],
            "tier": _tier(r, oa),
            "distance_km": round(km, 1),
            "eta_min": _eta_min(r, km),
        })
    for lst in scored.values():
        lst.sort(key=lambda x: x["eta_min"])

    assignments: list[dict[str, Any]] = []
    unfilled: list[dict[str, Any]] = []
    for rtype, count in pkg.items():
        picks = scored.get(rtype, [])[:count]
        for p in picks:
            p["rationale"] = (
                f"Closest available {rtype.replace('_', ' ')} ({p['home_unit']}, "
                f"{p['tier']}); ETA ~{p['eta_min']} min."
            )
            assignments.append(p)
        if len(picks) < count:
            unfilled.append({"type": rtype, "requested": count, "filled": len(picks)})

    filled = sum(1 for _ in assignments)
    requested = sum(pkg.values())
    fill_ratio = filled / requested if requested else 0.0
    confidence = round(min(incident["confidence"], 0.6 + 0.4 * fill_ratio), 3)

    obs = wx.get("observation", {})
    wind = obs.get("wind", {})
    drivers = [
        {
            "factor": "Red Flag Warning",
            "value": wx.get("red_flag_warning", {}).get("headline", "active"),
            "impact": "Escalates initial-attack package (extra engine + air support).",
        },
        {
            "factor": "Wind",
            "value": f"{wind.get('direction_cardinal', '?')} {wind.get('sustained_mph', '?')} mph, "
                     f"gusts {wind.get('gust_mph', '?')} mph",
            "impact": "Wind-driven spread toward the threatened community.",
        },
        {
            "factor": "Relative humidity",
            "value": f"{obs.get('relative_humidity_pct', '?')}%",
            "impact": "Very low humidity — rapid fire growth.",
        },
        {
            "factor": "Fuel moisture",
            "value": f"{obs.get('fuel_moisture_pct', '?')}%",
            "impact": "Critically dry fuels.",
        },
    ]

    rationale = (
        f"{incident['name']} is a wind-driven wildland fire threatening "
        f"{incident.get('threatened_community', 'nearby communities')} under an active "
        f"Red Flag Warning ({wx.get('escalation_risk', 'elevated')} risk). "
        f"Recommending an escalated initial-attack package of "
        + ", ".join(f"{c} {t.replace('_', ' ')}" for t, c in pkg.items())
        + ", drawn closest-first from the Operational Area and Mutual Aid Region II."
    )

    return {
        "incident_id": incident["incident_id"],
        "incident_name": incident["name"],
        "threatened_community": incident.get("threatened_community"),
        "operational_area": oa,
        "requested_package": pkg,
        "assignments": assignments,
        "unfilled": unfilled,
        "drivers": drivers,
        "confidence": confidence,
        "rationale": rationale,
        "lineage": {
            "incident": incident["fused_from"],
            "weather": wx.get("office", "NWS (mock)"),
            "inventory_as_of": "seed",
        },
    }


class InitialResponseTool(Tool):
    name = "recommend_initial_response"
    description = "Recommend an initial-attack package (US-04) with ETAs and rationale."

    async def run(self, **kwargs: Any) -> dict[str, Any]:
        return recommend()


registry.register(InitialResponseTool())

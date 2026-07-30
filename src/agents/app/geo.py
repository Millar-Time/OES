"""Shared geospatial + ETA helpers (demo-grade estimates)."""
from __future__ import annotations

import math
from typing import Any

GROUND_SPEED_KMH = 55.0
AIR_SPEED_KMH = 220.0
AIR_TYPES = {"aircraft"}


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return r * 2 * math.asin(math.sqrt(a))


def eta_min(resource: dict[str, Any], km: float) -> int:
    speed = AIR_SPEED_KMH if resource["type"] in AIR_TYPES else GROUND_SPEED_KMH
    travel = (km / speed) * 60.0
    return int(round(resource.get("readiness_min", 10) + travel))


def tier(resource: dict[str, Any], incident_oa: str) -> str:
    if resource["oa"] == incident_oa:
        return "Operational Area"
    if resource["oa"] == "STATE":
        return "State (Cal OES)"
    return "Mutual Aid Region II"

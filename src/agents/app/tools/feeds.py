"""US-01 — Incident Intelligence: fuse multiple signals into one incident.

Given raw feeds (CAD, camera, satellite), compute a single common-operating-picture
incident: a confidence-weighted centroid and a combined confidence, tagged with the
assigned incident metadata (name, threatened community, operational area).
"""
from __future__ import annotations

from typing import Any

from ..data import incident_feeds
from . import Tool, registry


def _combined_confidence(confidences: list[float]) -> float:
    """Probability at least one independent detection is a true fire: 1 - Π(1 - c)."""
    p_all_false = 1.0
    for c in confidences:
        p_all_false *= 1.0 - c
    return round(1.0 - p_all_false, 3)


def _weighted_centroid(feeds: list[dict[str, Any]]) -> dict[str, float]:
    total = sum(f["confidence"] for f in feeds) or 1.0
    lat = sum(f["lat"] * f["confidence"] for f in feeds) / total
    lon = sum(f["lon"] * f["confidence"] for f in feeds) / total
    return {"lat": round(lat, 5), "lon": round(lon, 5)}


def fuse(feeds: list[dict[str, Any]], assigned: dict[str, Any]) -> dict[str, Any]:
    sources = sorted({f["source"] for f in feeds})
    return {
        "incident_id": assigned["incident_id"],
        "name": assigned["name"],
        "type": assigned.get("type", "wildland"),
        "threatened_community": assigned.get("threatened_community"),
        "operational_area": assigned["operational_area"],
        "mutual_aid_region": assigned["mutual_aid_region"],
        "centroid": _weighted_centroid(feeds),
        "confidence": _combined_confidence([f["confidence"] for f in feeds]),
        "fused_from": sources,
        "feed_count": len(feeds),
        "first_detected_utc": min(f["received_utc"] for f in feeds),
        "status": "new",
    }


class FeedFusionTool(Tool):
    name = "fuse_incident_feeds"
    description = "Fuse CAD/camera/satellite feeds into one common-operating-picture incident."

    async def run(self, **kwargs: Any) -> dict[str, Any]:
        raw = incident_feeds()
        return fuse(raw["feeds"], raw["fused"])


registry.register(FeedFusionTool())

"""US-01 fusion tests — the demo's golden path must be deterministic."""
from app.tools.feeds import fuse
from app.data import incident_feeds


def test_fuse_produces_ridgeline_fire():
    raw = incident_feeds()
    result = fuse(raw["feeds"], raw["fused"])

    assert result["name"] == "Ridgeline Fire"
    assert result["operational_area"] == "JUS"
    assert result["feed_count"] == 3
    assert result["fused_from"] == ["CAD", "CAMERA", "SATELLITE"]
    assert result["threatened_community"] == "Cedar Hollow"


def test_combined_confidence_exceeds_any_single_feed():
    raw = incident_feeds()
    result = fuse(raw["feeds"], raw["fused"])

    max_single = max(f["confidence"] for f in raw["feeds"])
    assert result["confidence"] > max_single
    assert result["confidence"] > 0.9


def test_weighted_centroid_within_feed_bounds():
    raw = incident_feeds()
    result = fuse(raw["feeds"], raw["fused"])
    lats = [f["lat"] for f in raw["feeds"]]
    lons = [f["lon"] for f in raw["feeds"]]

    assert min(lats) <= result["centroid"]["lat"] <= max(lats)
    assert min(lons) <= result["centroid"]["lon"] <= max(lons)

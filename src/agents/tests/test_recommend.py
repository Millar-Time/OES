"""US-04 initial-response recommendation tests."""
from app.tools.recommend import recommend


def test_recommendation_escalates_under_red_flag():
    r = recommend()
    pkg = r["requested_package"]
    # Red-flag/extreme conditions escalate to 4 engines + 2 aircraft.
    assert pkg["engine"] == 4
    assert pkg.get("aircraft") == 2
    assert pkg["hand_crew"] == 1
    assert pkg["dozer"] == 1


def test_recommendation_fills_package_from_seed():
    r = recommend()
    assert r["unfilled"] == []
    assert len(r["assignments"]) == sum(r["requested_package"].values())


def test_assignments_sorted_by_eta_within_type():
    r = recommend()
    engines = [a for a in r["assignments"] if a["type"] == "engine"]
    etas = [a["eta_min"] for a in engines]
    assert etas == sorted(etas)
    # Every assignment carries a plain-language rationale (explainability).
    assert all(a.get("rationale") for a in r["assignments"])


def test_drivers_and_rationale_present():
    r = recommend()
    assert r["rationale"]
    factors = {d["factor"] for d in r["drivers"]}
    assert "Red Flag Warning" in factors
    assert r["threatened_community"] == "Cedar Hollow"

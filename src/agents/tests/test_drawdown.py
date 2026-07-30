"""US-07 drawdown guardrail tests."""
from app.tools.drawdown import assess


def test_empty_commit_is_ok_or_at_min():
    r = assess(set())
    assert r["any_breach"] is False
    assert all(a["status"] in ("OK", "AT_MIN") for a in r["areas"])


def test_overcommitting_justice_engines_breaches():
    # Committing all three available JUS engines drops it below its minimum of 2.
    r = assess({"E-4611", "E-4614", "E-4622"})
    jus = next(a for a in r["areas"] if a["oa"] == "JUS")
    assert jus["status"] == "BREACH"
    assert r["any_breach"] is True


def test_reports_every_operational_area():
    r = assess(set())
    oas = {a["oa"] for a in r["areas"]}
    assert {"JUS", "LIB", "UNI"} <= oas

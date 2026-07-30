"""US-06 ranked-orders tests."""
from app.tools.orders import rank_orders


def test_two_options_ranked():
    r = rank_orders()
    assert len(r["options"]) == 2
    ranks = sorted(o["rank"] for o in r["options"])
    assert ranks == [1, 2]
    assert sum(1 for o in r["options"] if o["recommended"]) == 1


def test_recommended_option_does_not_breach():
    r = rank_orders()
    rec = next(o for o in r["options"] if o["recommended"])
    assert rec["drawdown"]["any_breach"] is False


def test_protect_option_underfills_and_escalates():
    r = rank_orders()
    protect = next(o for o in r["options"] if o["name"] == "Protect OA coverage")
    assert protect["escalation_recommended"] is True
    assert protect["unfilled"]


def test_fastest_option_breaches_justice():
    r = rank_orders()
    fastest = next(o for o in r["options"] if o["name"] == "Fastest response")
    assert fastest["drawdown"]["any_breach"] is True


def test_rationale_present():
    r = rank_orders()
    assert r["recommended_rationale"]

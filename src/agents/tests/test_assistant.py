"""US-18 — grounded assistant tests."""
from app.tools.assistant import answer


def test_incident_intent_grounded():
    r = answer("summarize the incident")
    assert r["intent"] == "incident"
    assert "Ridgeline" in r["answer"] or "Fire" in r["answer"]
    assert "Incident fusion (US-01)" in r["sources"]
    assert r["facts"]


def test_weather_intent():
    r = answer("what's the wind and red flag warning?")
    assert r["intent"] == "weather"
    assert "NWS weather (US-03)" in r["sources"]


def test_resources_intent_counts():
    r = answer("how many engines are available?")
    assert r["intent"] == "resources"
    assert "Live inventory (US-11)" in r["sources"]


def test_orders_intent():
    r = answer("which resource order is best?")
    assert r["intent"] == "orders"
    assert any("US-06" in s or "US-07" in s for s in r["sources"])


def test_escalation_intent():
    r = answer("when do we escalate to mutual aid?")
    assert r["intent"] == "escalation"
    assert "Escalation ladder (US-10)" in r["sources"]


def test_trace_intent():
    r = answer("show the decision audit trail")
    assert r["intent"] == "trace"
    assert any("US-23" in s or "US-24" in s for s in r["sources"])


def test_empty_and_fallback_are_safe():
    assert answer("")["intent"] == "help"
    r = answer("xyzzy plugh nonsense")
    assert r["intent"] == "fallback"
    assert r["answer"]
    assert r["suggestions"]


def test_every_answer_has_sources_and_suggestions():
    for q in ["incident", "weather", "resources", "recommend", "orders", "drawdown", "escalation", "trace", "help"]:
        r = answer(q)
        assert r["answer"]
        assert r["sources"]
        assert r["suggestions"]

"""US-18 — Conversational Assistant (demo-safe, grounded responder).

Answers natural-language questions about the live operating picture **without an
LLM**: it classifies the question by intent and composes the answer from the same
seeded/fused data every other surface uses (incident fusion US-01, NWS weather
US-03, live inventory US-11, the recommendation US-04, ranked orders + drawdown
US-06/07, the mutual-aid ladder US-10, and the decision ledger US-23/24).

This keeps the demo deterministic — zero cost, latency, or network risk — and
every answer carries the sources it was grounded in. Swapping in a real LLM later
means replacing `answer()` with a tool-calling model over these same functions;
nothing else changes.
"""
from __future__ import annotations

import re
from typing import Any, Callable

from ..data import (
    escalation_tiers,
    incident_feeds,
    resource_inventory,
    weather as _weather,
)
from ..ledger import ledger
from .feeds import fuse
from .orders import rank_orders
from .recommend import recommend
from . import Tool, registry


def _incident() -> dict[str, Any]:
    raw = incident_feeds()
    return fuse(raw["feeds"], raw["fused"])


def _counts_by_type(status: str | None = "available") -> dict[str, int]:
    counts: dict[str, int] = {}
    for r in resource_inventory():
        if status and r["status"] != status:
            continue
        counts[r["type"]] = counts.get(r["type"], 0) + 1
    return counts


def _human_type(t: str) -> str:
    return t.replace("_", " ")


# ---- intent handlers -------------------------------------------------------
# Each returns (answer_text, facts, sources).

def _ans_incident() -> tuple[str, list[dict[str, str]], list[str]]:
    inc = _incident()
    pct = round(inc["confidence"] * 100, 1)
    answer = (
        f"The active incident is the **{inc['name']}** ({inc['type']}), threatening "
        f"{inc.get('threatened_community') or 'nearby communities'} in the "
        f"{inc['operational_area']} operational area ({inc['mutual_aid_region']}). "
        f"It was fused from {inc['feed_count']} independent feeds "
        f"({', '.join(inc['fused_from'])}) at {pct}% combined confidence, first detected "
        f"{inc['first_detected_utc']}."
    )
    facts = [
        {"label": "Incident", "value": inc["name"]},
        {"label": "Threatened", "value": inc.get("threatened_community") or "—"},
        {"label": "Confidence", "value": f"{pct}%"},
        {"label": "Sources", "value": ", ".join(inc["fused_from"])},
    ]
    return answer, facts, ["Incident fusion (US-01)"]


def _ans_weather() -> tuple[str, list[dict[str, str]], list[str]]:
    wx = _weather()
    obs = wx.get("observation", {})
    wind = obs.get("wind", {})
    rf = wx.get("red_flag_warning", {})
    rf_txt = (
        f"a Red Flag Warning is active ({rf.get('headline', 'active')})"
        if rf.get("active")
        else "no Red Flag Warning is active"
    )
    answer = (
        f"Per {wx.get('office', 'NWS (mock)')}, {rf_txt}. Winds are "
        f"{wind.get('direction_cardinal', '?')} at {wind.get('sustained_mph', '?')} mph "
        f"gusting {wind.get('gust_mph', '?')} mph, relative humidity "
        f"{obs.get('relative_humidity_pct', '?')}%, fuel moisture "
        f"{obs.get('fuel_moisture_pct', '?')}%. Escalation risk is "
        f"**{wx.get('escalation_risk', 'elevated')}** — wind-driven spread toward the "
        f"threatened community."
    )
    facts = [
        {"label": "Red Flag", "value": "Active" if rf.get("active") else "None"},
        {"label": "Wind", "value": f"{wind.get('direction_cardinal', '?')} {wind.get('sustained_mph', '?')}/{wind.get('gust_mph', '?')} mph"},
        {"label": "RH", "value": f"{obs.get('relative_humidity_pct', '?')}%"},
        {"label": "Risk", "value": str(wx.get("escalation_risk", "elevated"))},
    ]
    return answer, facts, ["NWS weather (US-03)"]


def _ans_resources() -> tuple[str, list[dict[str, str]], list[str]]:
    avail = _counts_by_type("available")
    total = _counts_by_type(None)
    total_avail = sum(avail.values())
    total_all = sum(total.values())
    lines = ", ".join(
        f"{avail.get(t, 0)}/{total[t]} {_human_type(t)}s" for t in sorted(total)
    )
    answer = (
        f"There are **{total_avail} of {total_all}** resources currently available across "
        f"all operational areas: {lines}. Availability drives every recommendation and "
        f"order the platform ranks."
    )
    facts = [
        {"label": _human_type(t).title(), "value": f"{avail.get(t, 0)}/{total[t]}"}
        for t in sorted(total)
    ]
    return answer, facts, ["Live inventory (US-11)"]


def _ans_recommendation() -> tuple[str, list[dict[str, str]], list[str]]:
    rec = recommend()
    pkg = ", ".join(f"{c} {_human_type(t)}" for t, c in rec["requested_package"].items())
    filled = len(rec["assignments"])
    requested = sum(rec["requested_package"].values())
    answer = (
        f"The recommended initial-attack package is **{pkg}** "
        f"({filled}/{requested} filled, {round(rec['confidence'] * 100)}% confidence). "
        f"{rec['rationale']}"
    )
    facts = [{"label": "Package", "value": pkg}, {"label": "Filled", "value": f"{filled}/{requested}"}]
    facts += [{"label": d["factor"], "value": d["value"]} for d in rec.get("drivers", [])[:2]]
    return answer, facts, ["Initial response (US-04)", "Incident fusion (US-01)", "NWS weather (US-03)"]


def _ans_orders() -> tuple[str, list[dict[str, str]], list[str]]:
    o = rank_orders()
    rec = next((x for x in o["options"] if x.get("recommended")), o["options"][0])
    others = [x for x in o["options"] if x is not rec]
    breach = " Fastest-response would breach a drawdown minimum, so it is ranked lower." if any(
        x["drawdown"]["any_breach"] for x in others
    ) else ""
    answer = (
        f"Two orders were ranked. Recommended: **{rec['name']}** — {rec['strategy']} "
        f"(avg ETA {rec['avg_eta_min']} min, {len(rec['assignments'])} units).{breach} "
        f"{o['recommended_rationale']}"
    )
    facts = [
        {"label": x["name"], "value": f"#{x['rank']} · {x['avg_eta_min']} min · "
         + ("breach" if x["drawdown"]["any_breach"] else "coverage ok")}
        for x in o["options"]
    ]
    return answer, facts, ["Resource orders (US-06)", "Drawdown guardrail (US-07)"]


def _ans_drawdown() -> tuple[str, list[dict[str, str]], list[str]]:
    o = rank_orders()
    rec = next((x for x in o["options"] if x.get("recommended")), o["options"][0])
    areas = rec["drawdown"]["areas"]
    parts = [
        f"{a['name']}: {a['engines_remaining']} engines (min {a['min_engines']}), "
        f"{a['hand_crews_remaining']} crews (min {a['min_hand_crews']}) — {a['status']}"
        for a in areas
    ]
    answer = (
        "Drawdown coverage under the recommended order keeps every operational area at or "
        "above its minimum: " + "; ".join(parts) + "."
    )
    facts = [{"label": a["name"], "value": a["status"]} for a in areas]
    return answer, facts, ["Drawdown guardrail (US-07)"]


def _ans_escalation() -> tuple[str, list[dict[str, str]], list[str]]:
    tiers = escalation_tiers()
    inc = _incident()
    ladder = " → ".join(f"L{t['level']} {t['name']}" for t in tiers)
    answer = (
        f"Mutual aid escalates through four tiers: {ladder}. When a tier cannot fill the "
        f"order, the request rolls up to the next. For the {inc['name']} in "
        f"{inc['operational_area']}, unfilled types would escalate from the Operational "
        f"Area to {inc['mutual_aid_region']}, then to State (Cal OES)."
    )
    facts = [{"label": f"L{t['level']} {t['code']}", "value": t["name"]} for t in tiers]
    return answer, facts, ["Escalation ladder (US-10)"]


def _ans_trace() -> tuple[str, list[dict[str, str]], list[str]]:
    entries = ledger.entries()
    integ = ledger.verify()
    last = entries[-1] if entries else None
    intact = "verified intact (tamper-evident hash chain)" if integ["intact"] else (
        f"BROKEN at entry #{integ['broken_at']}"
    )
    answer = (
        f"The decision ledger holds **{integ['count']} entries** and is {intact}. "
        + (f"Most recent: {last['actor']} — {last['action']} on '{last['target']}' "
           f"({last['rationale']})." if last else "")
    )
    facts = [{"label": "Entries", "value": str(integ["count"])},
             {"label": "Integrity", "value": "Verified" if integ["intact"] else "Broken"}]
    if last:
        facts.append({"label": "Latest", "value": f"{last['action']} · {last['target']}"})
    return answer, facts, ["Decision trace (US-23/US-24)"]


def _ans_help() -> tuple[str, list[dict[str, str]], list[str]]:
    answer = (
        "I'm grounded in the live operating picture. Ask me about the **incident**, "
        "**weather**, available **resources**, the recommended **initial attack**, ranked "
        "**resource orders** and the **drawdown** guardrail, **mutual-aid escalation**, or "
        "the **decision trace**. Every answer cites the data it came from."
    )
    facts: list[dict[str, str]] = []
    return answer, facts, ["Assistant (US-18)"]


# ---- intent routing --------------------------------------------------------

Handler = Callable[[], tuple[str, list[dict[str, str]], list[str]]]

# (handler, keywords, suggested follow-ups)
_INTENTS: list[tuple[str, Handler, tuple[str, ...], tuple[str, ...]]] = [
    ("weather", _ans_weather,
     ("weather", "wind", "red flag", "red-flag", "humidity", "forecast", "gust", "fuel moisture", "rh", "hot", "dry"),
     ("How does the weather change the recommendation?", "What resources are available?")),
    ("recommendation", _ans_recommendation,
     ("recommend", "initial attack", "initial-attack", "initial response", "package", "what should", "attack", "dispatch", "send"),
     ("Show the ranked resource orders", "What's the drawdown impact?")),
    ("orders", _ans_orders,
     ("order", "fastest", "protect", "rank", "option", "best order", "which order"),
     ("What's the drawdown impact?", "When do we escalate to mutual aid?")),
    ("drawdown", _ans_drawdown,
     ("drawdown", "coverage", "minimum", "deplete", "left behind", "remaining", "guardrail"),
     ("When do we escalate to mutual aid?", "Show the ranked resource orders")),
    ("resources", _ans_resources,
     ("resource", "engine", "crew", "hand crew", "available", "how many", "inventory", "dozer", "aircraft", "units"),
     ("What's the recommended initial attack?", "Show the ranked resource orders")),
    ("escalation", _ans_escalation,
     ("escalat", "mutual aid", "mutual-aid", "region", "state", "tier", "ladder", "cal oes"),
     ("What's the recommended initial attack?", "Summarize the incident")),
    ("trace", _ans_trace,
     ("trace", "audit", "ledger", "who approved", "decision history", "tamper", "chain", "log"),
     ("Summarize the incident", "What's the recommended initial attack?")),
    ("incident", _ans_incident,
     ("incident", "fire", "what's happening", "whats happening", "situation", "summary", "summarize", "overview", "where", "confidence", "detected"),
     ("What's the weather driving this?", "What's the recommended initial attack?")),
    ("help", _ans_help,
     ("help", "what can you", "capabilities", "how do you work", "hello", "hi ", "what do you"),
     ("Summarize the incident", "What's the recommended initial attack?")),
]

_DEFAULT_SUGGESTIONS = (
    "Summarize the incident",
    "What's the weather?",
    "What's the recommended initial attack?",
    "Show the ranked resource orders",
)


def _score(question: str, keywords: tuple[str, ...]) -> int:
    q = f" {question.lower()} "
    return sum(1 for kw in keywords if kw in q or re.search(rf"\b{re.escape(kw)}", q))


def answer(question: str) -> dict[str, Any]:
    q = (question or "").strip()
    if not q:
        text, facts, sources = _ans_help()
        return {
            "question": q, "intent": "help", "answer": text, "facts": facts,
            "sources": sources, "suggestions": list(_DEFAULT_SUGGESTIONS),
        }

    best_intent = "incident"
    best_handler: Handler = _ans_incident
    best_suggestions: tuple[str, ...] = _DEFAULT_SUGGESTIONS
    best_score = 0
    for intent, handler, keywords, suggestions in _INTENTS:
        s = _score(q, keywords)
        if s > best_score:
            best_score, best_intent, best_handler, best_suggestions = s, intent, handler, suggestions

    text, facts, sources = best_handler()
    if best_score == 0:
        # No keyword matched — lead with a situation summary and say so honestly.
        text = (
            "I don't have that exact answer wired for the demo, so here's the current "
            "situation to ground us. " + text
        )
        best_intent = "fallback"
        best_suggestions = _DEFAULT_SUGGESTIONS

    return {
        "question": q,
        "intent": best_intent,
        "answer": text,
        "facts": facts,
        "sources": sources,
        "suggestions": list(best_suggestions),
    }


class AssistantTool(Tool):
    name = "assistant_answer"
    description = "Answer a natural-language question grounded in the live operating picture (US-18)."

    async def run(self, question: str = "", **kwargs: Any) -> dict[str, Any]:
        return answer(question)


registry.register(AssistantTool())

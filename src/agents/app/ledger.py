"""US-24 — Immutable decision-trace ledger.

An append-only, hash-chained record of every consequential action: who did it,
what they did, to what, why, and when. Each entry embeds the hash of the prior
entry, so any tampering with an earlier record invalidates every hash after it
(tamper-evident). For the demo this lives in-process, seeded with the system's
own detection + recommendation steps so the trace is coherent from the first
click; in production the same shape persists to an append-only Cosmos container.

US-23 explainability rides on the same records: every entry carries a rationale
and, where relevant, the confidence and data/rule lineage behind the action.
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any

GENESIS_HASH = "0" * 64


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


@dataclass
class TraceEntry:
    seq: int
    ts: str
    actor: str
    action: str
    target: str
    rationale: str
    details: dict[str, Any] = field(default_factory=dict)
    prev_hash: str = GENESIS_HASH
    entry_hash: str = ""

    def payload(self) -> str:
        return "|".join([
            self.prev_hash,
            str(self.seq),
            self.ts,
            self.actor,
            self.action,
            self.target,
            self.rationale,
            json.dumps(self.details, sort_keys=True, separators=(",", ":")),
        ])

    def compute_hash(self) -> str:
        return hashlib.sha256(self.payload().encode("utf-8")).hexdigest()


class TraceLedger:
    """In-process append-only hash chain. Thread-safety is not required for the
    single-worker demo; a real deployment persists each entry to Cosmos."""

    def __init__(self) -> None:
        self._entries: list[TraceEntry] = []
        self._seed()

    def _append(self, actor: str, action: str, target: str, rationale: str,
                details: dict[str, Any] | None = None, ts: str | None = None) -> TraceEntry:
        prev = self._entries[-1].entry_hash if self._entries else GENESIS_HASH
        entry = TraceEntry(
            seq=len(self._entries),
            ts=ts or _now_iso(),
            actor=actor,
            action=action,
            target=target,
            rationale=rationale,
            details=details or {},
            prev_hash=prev,
        )
        entry.entry_hash = entry.compute_hash()
        self._entries.append(entry)
        return entry

    def _seed(self) -> None:
        """Seed the system's own steps so the trace reads as a full story."""
        self._append(
            actor="System · Fusion Agent",
            action="incident.detected",
            target="INC-2026-0729-0142 · Ridgeline Fire",
            rationale="Fused CAD 911, ALERTCalifornia camera, and GOES-19 satellite feeds into one incident.",
            details={"confidence_pct": 90, "feeds": ["CAD", "CAMERA", "SATELLITE"], "threatened": "Cedar Hollow"},
            ts="2026-07-29T18:46:10Z",
        )
        self._append(
            actor="System · Weather Agent",
            action="weather.assessed",
            target="INC-2026-0729-0142",
            rationale="Red Flag Warning in effect — extreme fire behavior expected.",
            details={"risk": "EXTREME", "gust_mph": 41, "fuel_moisture_pct": 4, "rh_pct": 9},
            ts="2026-07-29T18:47:02Z",
        )
        self._append(
            actor="System · Resource Agent",
            action="recommendation.generated",
            target="INC-2026-0729-0142 · order options",
            rationale="Ranked 2 order options; recommended 'Protect OA coverage' to avoid a Justice County drawdown breach.",
            details={"options": 2, "recommended": "Protect OA coverage", "guardrail": "drawdown-minimums"},
            ts="2026-07-29T18:48:20Z",
        )

    def record(self, actor: str, action: str, target: str, rationale: str,
               details: dict[str, Any] | None = None) -> TraceEntry:
        return self._append(actor, action, target, rationale, details)

    def entries(self) -> list[dict[str, Any]]:
        return [asdict(e) for e in self._entries]

    def verify(self) -> dict[str, Any]:
        """Recompute the chain; report whether it is intact and where it broke."""
        prev = GENESIS_HASH
        for e in self._entries:
            expected_prev = prev
            recomputed = TraceEntry(
                seq=e.seq, ts=e.ts, actor=e.actor, action=e.action, target=e.target,
                rationale=e.rationale, details=e.details, prev_hash=e.prev_hash,
            ).compute_hash()
            if e.prev_hash != expected_prev or e.entry_hash != recomputed:
                return {"intact": False, "broken_at": e.seq, "count": len(self._entries)}
            prev = e.entry_hash
        return {"intact": True, "broken_at": None, "count": len(self._entries)}


ledger = TraceLedger()

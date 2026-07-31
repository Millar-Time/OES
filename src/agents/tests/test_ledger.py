"""US-24 — decision-trace ledger tests."""
from app.ledger import GENESIS_HASH, TraceLedger


def test_ledger_seeded_with_system_steps():
    led = TraceLedger()
    entries = led.entries()
    assert len(entries) >= 3
    assert entries[0]["action"] == "incident.detected"
    assert entries[0]["prev_hash"] == GENESIS_HASH
    assert entries[0]["seq"] == 0


def test_append_chains_hashes():
    led = TraceLedger()
    before = len(led.entries())
    e = led.record(actor="Tom Brills", action="order.approve", target="Protect OA coverage",
                   rationale="Approved.", details={"resources": ["E-4611"]})
    entries = led.entries()
    assert len(entries) == before + 1
    assert e.prev_hash == entries[-2]["entry_hash"]
    assert e.seq == before


def test_chain_verifies_intact():
    led = TraceLedger()
    led.record(actor="Tom", action="order.override", target="Fastest response", rationale="x")
    integrity = led.verify()
    assert integrity["intact"] is True
    assert integrity["broken_at"] is None


def test_tampering_breaks_the_chain():
    led = TraceLedger()
    led.record(actor="Tom", action="order.approve", target="Protect OA coverage", rationale="ok")
    # Tamper with an earlier record's rationale without recomputing hashes.
    led._entries[1].rationale = "TAMPERED"
    integrity = led.verify()
    assert integrity["intact"] is False
    assert integrity["broken_at"] == 1

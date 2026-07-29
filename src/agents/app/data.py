"""Seed-data loader.

Loads the synthetic golden-path datasets from `data/seed`. For the demo these
stand in for live external systems; swapping to real connectors later happens
behind the tool interface, not here.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

# repo_root/data/seed  (app -> agents -> src -> repo root)
SEED_DIR = Path(__file__).resolve().parents[3] / "data" / "seed"


@lru_cache(maxsize=None)
def load(name: str) -> Any:
    path = SEED_DIR / f"{name}.json"
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def incident_feeds() -> dict[str, Any]:
    return load("incident_feeds")


def resource_inventory() -> list[dict[str, Any]]:
    return load("resource_inventory")["resources"]


def weather() -> dict[str, Any]:
    return load("weather_nws")


def drawdown_minimums() -> list[dict[str, Any]]:
    return load("drawdown_minimums")["drawdown_minimums"]


def escalation_tiers() -> list[dict[str, Any]]:
    return load("escalation_tiers")["tiers"]

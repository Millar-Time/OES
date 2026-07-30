"""Seed-data loader.

Loads the synthetic golden-path datasets from `data/seed`. For the demo these
stand in for live external systems; swapping to real connectors later happens
behind the tool interface, not here.
"""
from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Any


def _resolve_seed_dir() -> Path:
    """Locate the seed dir across local (src/agents/app) and hosted layouts.

    Order: explicit OES_SEED_DIR env var, then the local repo layout
    (repo_root/data/seed), then an upward walk from this file looking for any
    `data/seed` folder (covers App Service where the app is bundled with a
    sibling `data/seed`).
    """
    override = os.environ.get("OES_SEED_DIR")
    if override and Path(override).is_dir():
        return Path(override)

    here = Path(__file__).resolve()
    # repo_root/data/seed  (app -> agents -> src -> repo root)
    candidate = here.parents[3] / "data" / "seed"
    if candidate.is_dir():
        return candidate

    for parent in here.parents:
        candidate = parent / "data" / "seed"
        if candidate.is_dir():
            return candidate

    # Fall back to the local layout path so errors are legible.
    return here.parents[3] / "data" / "seed"


SEED_DIR = _resolve_seed_dir()


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

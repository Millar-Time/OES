# OES Seed Data

Synthetic, golden-path demo data — **no real incident data, PII, or CJI.** Everything the
agents "read" from external systems is seeded here and served through the tool interface
(`src/agents/app/tools`), so no live federal/vendor connections are used in the demo.

## Contents (built in F2)

- `seed/incident_feeds.json` — mock CAD, camera, and satellite detections for one wind-driven ignition
- `seed/weather_nws.json` — seeded NWS red-flag + wind-vector payload
- `seed/resource_inventory.json` — engines, crews, aircraft with location/readiness/status
- `seed/drawdown_minimums.json` — per-area minimum coverage thresholds
- `seed/escalation_tiers.json` — four-tier mutual-aid model (OA → Region → State)

## Status

Scaffold only (F1). Datasets authored in F2 (`docs/backlog.md`).

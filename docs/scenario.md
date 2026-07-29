# OES Demo — Scenario & Persona (Story Bible)

The single, concrete narrative the demo plays out. Everything on screen — data, names,
map — comes from this. All fictional and synthetic (no real people, incidents, PII, or CJI).

---

## Primary persona — Tom Brills

- **Name:** Tom Brills
- **Role:** Operational Area Fire & Rescue Coordinator (Duty Chief), **Justice County**
- **He is the human-in-the-loop** — the person who approves, modifies, or overrides every
  agent recommendation in the demo (US-21). The autonomy dial (US-20) is *his* control.
- **Responsibilities:** mobilize and track fire resources across Justice County; request
  mutual aid up the California tiers when the county can't fill an order; keep the county
  from being stripped below safe coverage (drawdown).
- **Goals:**
  - One authoritative picture of a new incident — not five phone calls and a whiteboard.
  - Fast, *defensible* resource orders he can justify in an after-action review.
  - Never drop his county below minimum coverage while helping a neighbor.
- **Pain points today:** manual phone/fax/radio mobilization; slow availability checks;
  no audit trail of *why* a decision was made.
- **What "good" looks like for Tom:** he sees the incident, gets ranked options with
  rationale and confidence, approves one, and the order flows to IROC/IRWIN automatically —
  with every step logged.

Maps to the backlog personas **Duty Chief** and **OA Coordinator**.

---

## Place — Justice County

- Fictional county in **California**, **Mutual Aid Region II** (NorCal). OA code **`JUS`**.
- **County seat:** Faircourt (Operational Area EOC / ECC).
- **Community at risk:** **Cedar Hollow** — a wildland-urban-interface town (~4,200 residents)
  in the foothills below Ridgeline Road, directly downwind of the ignition.
- **Terrain:** oak-grass foothills rising into timber; steep canyons that channel wind.
- **Neighboring operational areas** (for mutual-aid escalation):
  **Liberty County (`LIB`)** and **Union County (`UNI`)**, both Region II.
- **Escalation ladder:** Local → Justice OA → **Region II** → **State (Cal OES)** → (Federal, out of scope).

---

## The incident — "Ridgeline Fire"

- **What:** wind-driven vegetation fire, ignited off **Ridgeline Road** above Cedar Hollow.
- **When:** 29 Jul 2026, ~18:41 UTC, during a **Red Flag Warning**.
- **Conditions:** NE offshore wind, sustained 22 mph, gusts 41; RH 9%; temp 98°F; extreme risk.
- **Threat:** Cedar Hollow is downwind and could be impacted within hours; evacuation-relevant.
- **Detected by three feeds** that fuse into one incident:
  1. **CAD** — Justice County ECC 911 dispatch (VEG-FIRE off Ridgeline Rd)
  2. **Camera** — ALERTCalifornia PTZ on Cedar Peak (smoke, ML-confirmed)
  3. **Satellite** — GOES hotspot (mock FRP reading)

---

## Narrative beats → golden path → stories

| Beat | What Tom sees | Story |
|------|---------------|-------|
| 1 | Three feeds converge into **one** Ridgeline Fire incident on the Justice County map | US-01 |
| 2 | Red-flag warning + wind vector on the incident card | US-03 |
| 3 | Decision Support proposes an initial response with a one-line rationale | US-04 |
| 4 | Resource Recommendation returns 2–3 ranked orders — confidence, rationale, drawdown impact | US-06, US-23 |
| 5 | An option that would strip Justice below 2 engines is **blocked** by the drawdown rule | US-07 |
| 6 | Tom **approves / modifies / overrides**; sets engines to L2, aircraft to L1 | US-21, US-20 |
| 7 | Availability is polled; the approved order syncs to a **mock IROC/IRWIN** | US-11, US-25 |
| 8 | Order exceeds Justice OA capacity → **escalates to Region II**; Tom tunes a threshold live | US-10, US-09 |
| 9 | Statewide **twin** updates; Tom asks the assistant a question; the **trace ledger** shows every step | US-15, US-18, US-24 |

---

## Naming glossary (use these exact names in code, data, and UI)

| Concept | Value |
|---------|-------|
| Coordinator (user) | Tom Brills |
| County / OA | Justice County (`JUS`) |
| OA seat / EOC | Faircourt |
| WUI town at risk | Cedar Hollow |
| Incident | Ridgeline Fire (`INC-2026-0729-0142`) |
| Neighbor OAs | Liberty (`LIB`), Union (`UNI`) |
| Region | Mutual Aid Region II |

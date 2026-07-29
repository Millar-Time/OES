# OES Demo — Build Backlog (Planner Output)

Source of truth for scope: `demo_user_stories.xlsx` (OneDrive). This file decomposes the
**15 IN DEMO** stories into an execution roadmap with dependencies. Build order below.
Stack (confirmed): React 19 + Vite + Azure Maps · Python FastAPI + Microsoft Agent Framework
on Azure OpenAI · Azure App Service · Cosmos DB serverless · RBAC + Managed Identity, no secrets.

## Phase 1 — Foundation / scaffold

| Task | What | Depends on |
|------|------|-----------|
| F1 repo-scaffold | `src/web`, `src/agents`, `infra`, `data` folders + skeleton apps + READMEs | — |
| F2 data-seed | Seeded golden-path dataset: mock CAD/camera/satellite feeds, NWS weather payload, resource inventory, drawdown minimums, 4-tier escalation rules | F1 |
| F3 infra-bicep | Bicep (RG-scoped): App Service, Azure OpenAI, Cosmos serverless, Azure Maps, Log Analytics/App Insights; system-assigned MI + least-priv role assignments; no keys | F1 |
| F4 agent-svc-skeleton | FastAPI app; Microsoft Agent Framework Mission Orchestrator; agent registry; MCP-style tool interface over seeded data | F1, F2 |
| F5 web-skeleton | React/Vite app; Azure Maps COP canvas shell (MI-auth token); incident card + layout | F1 |
| F6 trace-ledger | Append-only decision-trace store in Cosmos + write helper (actor, action, rationale, ts) | F3 |
| F7 cicd | GitHub Actions deploy via OIDC federation to Azure (no stored creds) | F1, F3 |

## Phase 2 — Vertical slice: COP + recommendation

| Story | Task | Depends on |
|-------|------|-----------|
| US-01 | Fuse 3+ mock feeds → one live COP incident on the map | F2, F4, F5 |
| US-03 | Red-flag + wind-vector context on incident card (seeded NWS) | US-01 |
| US-04 | Decision Support: initial recommended response + one-line rationale | US-01, F4 |
| US-06 | Resource Recommendation: 2–3 ranked orders w/ confidence, rationale, drawdown impact | US-04 |
| US-07 | Enforce drawdown minimums — block/flag breaching recommendations | US-06, F2 |
| US-23 | Every recommendation carries rationale, confidence %, data/rule lineage | US-06 |

## Phase 3 — Governance / human-in-the-loop / trace

| Story | Task | Depends on |
|-------|------|-----------|
| US-21 | Approve / modify / override any agent action; log it | US-06, F6 |
| US-20 | Set autonomy level per resource type (engines L2, aircraft L1); behavior differs | US-21 |
| US-24 | Immutable decision-trace ledger view (ordered, timestamped, actors) | F6, US-21 |
| US-10 | Four-tier mutual-aid escalation (OA→Region→State) encoded | US-06 |
| US-09 | No-code config surface for drawdown/escalation thresholds; alters live rec | US-07, US-10 |

## Phase 4 — Interop / twin / availability / assistant

| Story | Task | Depends on |
|-------|------|-----------|
| US-11 | Availability polling — mark seeded units confirmed/soft-reserved on approval | US-06 |
| US-25 | Place approved order via mock IROC/IRWIN interface; show "synced" | US-21 |
| US-15 | Statewide digital-twin map: units, readiness, coverage; updates on order | US-01, F5 |
| US-18 | Conversational assistant over the COP, grounded in live incident + inventory | US-01, US-06 |

## Notes

- Every external system (IROC, IRWIN, CAD, AVL, weather) is **mocked** behind a tool interface.
- Demo runs at autonomy **L1–L2**; human approval is a first-class step.
- Do not widen scope beyond these 15. STRETCH/OUT OF SCOPE stories stay in the xlsx only.
- Task status tracked in the session todos DB (mirrors this table).

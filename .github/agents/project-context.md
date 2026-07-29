# Project Context: OES — Firefighting Resource Mobilization Platform (Demo)

Use this as the source of truth for all agents in this repository.
For full guardrails, see `.github/copilot-instructions.md`.

## What This Project Is
- Vertical-slice **demo** for Cal OES RFI A261018369 — an agentic firefighting resource mobilization platform.
- Key users/personas: statewide/regional fire coordinators, ops center staff, mutual-aid dispatchers.
- Core problem it solves: the *downstream* gap — turning a detected signal into a fast,
  auditable, human-approved resource order. Detection is already crowded; mobilization is not.

## Technology Stack
- **Backend / agents**: Python (FastAPI) agent service — Mission Orchestrator + specialists.
  Reasoning on Azure OpenAI / Azure AI Foundry. *(Proposed — confirm before build.)*
- **Frontend**: React 19 + TypeScript + Vite; map view (MapLibre / Azure Maps). *(Proposed.)*
- **Database**: Seeded/mock JSON now; Cosmos DB or Storage for seed data + decision-trace ledger *(TBD)*.
- **Hosting**: Azure Container Apps (or App Service). *(Proposed — confirm.)*
- **Auth**: Microsoft Entra ID; **Managed Identity + RBAC only, passwordless**. GitHub→Azure via OIDC.
- **IaC**: Bicep, RG-scoped.

## Key Project Paths
- `.github/agents/` — Copilot agents (27: 24 core + compliance-agent, mermaid, pre-deploy-gate)
- `.github/copilot-instructions.md` — project brain (all agents read first)
- `docs/plan.md` — golden-path build plan and phases
- `src/web/` — React/TS front end *(to scaffold)*
- `src/agents/` — Python agent service *(to scaffold)*
- `infra/` — Bicep IaC, MI + RBAC *(to scaffold)*
- `data/` — seeded/mock golden-path data *(to scaffold)*

## Domain Entities
- Incident (wind-driven ignition), Common Operating Picture (COP), Resource (engines/crews/aircraft),
  Order (resource request), Drawdown level, Decision-trace record, Autonomy level (L0–L4),
  Mutual-aid region (FIRESCOPE/CA OES), mock external systems (IROC, IRWIN, CAD, AVL, weather).

## Architecture Pattern
- Agent mesh: a **Mission Orchestrator** routing to specialist agents (Incident Intelligence,
  Decision Support, Resource Recommendation, IROC/IRWIN Interop [mock], Digital Twin / Trace).
- Tools are MCP-style interfaces over **seeded/mock data** — no live federal/vendor feeds.
- Append-only **decision-trace ledger** records every agent action and human decision.
- Human-in-the-loop is a first-class actor; demo runs at autonomy **L1–L2**.

## Compliance & Constraints
- **Cloud: Azure Commercial** (confirmed). Demo is not an accredited environment.
- RFI narrative targets FedRAMP High / CJIS / US data residency; the demo does NOT implement
  full controls and uses **synthetic data only** (no real incident data, PII, or CJI).
- Azure target: Subscription `sub_dev` (`8b724cc4-21a9-4131-a67f-08978c02078b`), RG `OES`, region East US 2.
- **Security baseline (non-negotiable): RBAC + Managed Identity, no secrets/keys/connection strings.**

## Current State
- Complete: repo scaffold, project brain, build plan, 27 agents synced, first commit pushed to
  `github.com/Millar-Time/OES`.
- In-progress: framing/plan. Next: confirm stack, then Phase 1 scaffold (`src/web`, `src/agents`, `infra`, `data`).
- Gaps / needs clarification: tech stack confirmation, hosting choice, data store choice, RG cost-center tag.
- Backlog of record lives in `demo_user_stories.xlsx` (OneDrive, not committed) — build only IN DEMO stories.

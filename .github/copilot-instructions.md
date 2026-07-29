# Project Instructions

> This file configures all GitHub Copilot agents for this project.
> All agents read this file first to understand project context.

## Project Overview

- **Name**: OES — Firefighting Resource Mobilization Platform (Demo)
- **Description**: Demonstration platform for Cal OES RFI A261018369. A vertical-slice
  "agentic" demo that closes the downstream mobilization gap: signal in → fused common
  operating picture → recommendation → human-approved order → auditable decision trace.
- **Repository**: https://github.com/Millar-Time/OES
- **Team**: Microsoft ISD + partners (demo build)

## Scope discipline (read first)

- **We are NOT building the whole platform.** We build one **golden-path vertical slice**.
- Backlog of record: `demo_user_stories.xlsx` (kept on OneDrive, not committed).
  Only stories marked **IN DEMO** get built. STRETCH is if-time-allows. OUT OF SCOPE is
  described in the RFI response, never built for the demo.
- If IN DEMO grows past capacity, push stories to STRETCH — **do not widen the golden path**.

## The golden path (the single demo narrative)

One wind-driven incident drives everything:
1. Incoming signal fused into one common operating picture (COP) — *Incident Intelligence agent*
2. Decision-support agent proposes an initial response
3. Resource-recommendation agent returns ranked, **drawdown-aware** options
4. **Human approves** (human-in-the-loop; demo runs at autonomy Level 1–2)
5. Order synced via a **mock** IROC/IRWIN interface
6. Every step written to an **immutable decision-trace ledger**

## Tech Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | React 19 + TypeScript + Vite; map view (MapLibre/Azure Maps) | **Proposed — confirm** |
| Agent service | Python (FastAPI) on Azure AI Foundry / Azure OpenAI; Microsoft Agent Framework | **Proposed — confirm** |
| Orchestration | Mission Orchestrator + specialist agents (see golden path) | Proposed |
| Data | Seeded/mock JSON behind tool interfaces (no live federal/vendor feeds) | Confirmed |
| Hosting | Azure Container Apps (or App Service) | Proposed — confirm |
| Cloud | **Azure Commercial** | **Confirmed** |
| CI/CD | GitHub Actions (OIDC → Azure, no stored credentials) | Confirmed |
| Auth | Microsoft Entra ID | Confirmed |

> Stack rows marked "Proposed — confirm" are the recommended default; confirm before @executor builds.

## Azure Target (Confirmed)

| Setting | Value |
|---------|-------|
| Cloud | Azure Commercial |
| Subscription | `sub_dev` |
| Subscription ID | `8b724cc4-21a9-4131-a67f-08978c02078b` |
| Resource Group | `OES` |
| Region | East US 2 (`eastus2`) |
| Naming | `<type>-oes-demo-<region>` (e.g., `ca-oes-demo-eastus2`) |
| Tags | `project=OES`, `env=demo`, `costcenter=<TBD>` |

## Compliance & Governance

- **Frameworks**: Demo is not an accredited environment. The RFI narrative targets
  FedRAMP High / CJIS / US data residency; the **demo** does not implement full controls
  and does not use real CJI or production data.
- **Cloud Boundary**: Azure Commercial (demo only).
- **Regions**: East US 2.
- **Data Classification**: Synthetic/seeded demo data only — no real incident or PII/CJI.

## Security — NON-NEGOTIABLE

- **Always use Azure RBAC + Managed Identity.** No secrets, keys, connection strings, or
  SAS tokens in code, config, or pipelines. Service-to-service auth is passwordless
  (managed identity + role assignments). GitHub → Azure uses OIDC federation.
- Any resource that must hold a secret uses **Key Vault referenced via managed identity** —
  never inline.
- Least-privilege role assignments scoped to the `OES` resource group.

## Folder Structure

```
OES/
├─ .github/
│  ├─ agents/                 → synced Copilot agents (conductor, executor, ...)
│  └─ copilot-instructions.md → THIS FILE (project brain)
├─ docs/                      → plan.md, design notes, references
├─ src/
│  ├─ web/                    → React/TS front end
│  └─ agents/                 → Python agent service (orchestrator + specialists)
├─ infra/                     → Bicep IaC (RG-scoped), RBAC + MI
├─ data/                      → seeded/mock golden-path data
└─ README.md
```

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Cloud boundary | Azure Commercial | Newest Azure AI capabilities land here first; demo only |
| Auth | Managed Identity + RBAC (passwordless) | Security baseline; no secret sprawl |
| Integrations | Mocked behind tool interfaces | Demo shows the interaction, not certified connections |
| Autonomy in demo | Level 1–2 (human approves) | Higher levels described as a dial, not executed |
| IaC | Bicep | Azure-native; RG-scoped deployment |

## Agent-Specific Notes

### For @executor
- Build only IN DEMO stories from `demo_user_stories.xlsx`. Confirm stack before starting.
- Ground all agent outputs in seeded data — no freelancing from model memory.

### For @security-agent
- Enforce RBAC + Managed Identity everywhere. Flag any key/secret/connection string.
- Human-in-the-loop is a first-class actor: every agent action is approvable/overridable.

### For @devops-agent
- Bicep only (no Terraform). Deploy scoped to RG `OES` in sub `sub_dev`.
- GitHub Actions with OIDC federation to Azure — no stored credentials.

### For @azure-specialist / @architect
- Target services must exist in Azure Commercial, East US 2.
- Digital twin, COP map, and decision trace are the signature demo surfaces.

### For @finops-agent
- Commercial pricing. Prefer serverless/consumption. Alert on unexpected >$100/mo.

## Do NOT

- Commit secrets, keys, connection strings, or SAS tokens — ever.
- Use hardcoded URLs or credentials — everything via configuration + managed identity.
- Connect to real federal/vendor systems (IROC, IRWIN, CAD, AVL) — all mocked for the demo.
- Widen the golden path or build OUT OF SCOPE stories.
- Use real incident data, PII, or CJI in the demo.

# OES Demo — Build Plan

**RFI A261018369 · Cal OES Firefighting Resource Mobilization Platform**
Status: framing / pre-build · Cloud: Azure Commercial · RG: `OES` (sub `sub_dev`, East US 2)

---

## 1. What we are building

A **vertical-slice demo** that proves the agentic mobilization story end-to-end for ONE
wind-driven incident. Not the full platform — a believable, working golden path.

**Demo thesis:** detection is a solved, crowded space; the unmet need is *downstream* —
turning signal into fast, auditable, human-approved resource orders. The demo shows that.

**Scenario & persona:** see [`docs/scenario.md`](scenario.md) — user **Tom Brills** (OA Coordinator,
**Justice County**), incident **Ridgeline Fire** above **Cedar Hollow**. Use those exact names.

## 2. The golden path (the demo script)

| Step | What the audience sees | Agent | Autonomy |
|------|------------------------|-------|----------|
| 1 | A wind-driven ignition appears on a live map, fused from mock CAD/camera/satellite/weather | Incident Intelligence | L1 |
| 2 | An initial recommended response appears with a one-line rationale | Decision Support | L1–L2 |
| 3 | 2–3 ranked order options with confidence, rationale, **drawdown guardrail** | Resource Recommendation | L2 |
| 4 | Coordinator **approves / overrides** (human-in-the-loop) | — (human) | — |
| 5 | Order synced to a **mock** IROC/IRWIN; record shows "synced" | IROC/IRWIN Interop | L2–L3 |
| 6 | A statewide **digital twin** updates; an **immutable decision trace** lists every step | Digital Twin + Trace | — |

Plus: a **conversational assistant** over the COP (natural-language questions) and an
**autonomy dial** (set engines to L2, aircraft to L1) to demonstrate governed automation.

## 3. Scope discipline

- Backlog of record: `demo_user_stories.xlsx` (OneDrive). **13 IN DEMO** stories map to the
  steps above. STRETCH = if time allows. OUT OF SCOPE = described in RFI, not built.
- Guardrail: if IN DEMO exceeds capacity, push to STRETCH — never widen the golden path.

## 4. Architecture (proposed — confirm stack)

```
[React/TS web + map]  ──►  [Python agent service (FastAPI)]  ──►  [Azure OpenAI / AI Foundry]
        │                          │  Mission Orchestrator
        │                          ├─ Incident Intelligence   ─┐
        │                          ├─ Decision Support         │ tools (MCP-style)
        │                          ├─ Resource Recommendation  ├─►  [seeded/mock data]
        │                          ├─ IROC/IRWIN Interop (mock)│      (no live feeds)
        │                          └─ Digital Twin / Trace     ─┘
        └──────────────  decision-trace ledger (append-only)  ──────────────┘
```

- **Everything external is mocked** behind a tool interface (IROC, IRWIN, CAD, AVL, weather).
- **Mapping: Azure Maps** is the primary COP canvas — incident marker, wind vector, resource
  positions, and drawdown/mutual-aid region overlays. Auth via managed identity + RBAC (no key).
- **RBAC + Managed Identity everywhere.** No secrets/keys. GitHub→Azure via OIDC.

## 5. Azure footprint (all in RG `OES`, East US 2, Commercial)

| Resource | Purpose | Auth |
|----------|---------|------|
| Azure OpenAI (or AI Foundry) | Agent reasoning models | MI + RBAC |
| Azure Maps | COP map canvas + digital-twin view (incident, wind, resources, region overlays) | MI + RBAC (Entra-based, no shared key) |
| App Service | Host web + agent service | System-assigned MI |
| Cosmos DB (serverless) | Seeded data + decision-trace ledger | MI + RBAC |
| Key Vault | Any unavoidable secret (referenced, not inlined) | MI + RBAC |
| Log Analytics / App Insights | Telemetry + traces | MI |
| Managed Identity + role assignments | Passwordless service-to-service | — |

> Confirm exact hosting + data store when stack is locked. Naming: `<type>-oes-demo-eastus2`.

## 6. Phased plan

- **Phase 0 — Framing (now).** Repo + agents + project brain + this plan. Confirm stack & RG. ✅ mostly done
- **Phase 1 — Scaffold.** `src/web`, `src/agents`, `infra` (Bicep, RG-scoped, MI+RBAC), `data` seed set. Golden-path data model.
- **Phase 2 — Vertical slice.** Steps 1–3: COP map + Incident Intelligence + Decision Support + Resource Recommendation (with drawdown rule). Real model reasoning over seeded data.
- **Phase 3 — Human-in-the-loop + trace.** Step 4 approval/override; step 6 decision-trace ledger; autonomy dial.
- **Phase 4 — Interop + twin.** Step 5 mock IROC/IRWIN sync; statewide digital-twin view.
- **Phase 5 — Polish + demo run.** Conversational assistant, scripted scenario, dry run.

## 7. Open decisions (need confirmation)

1. **Cost center tag** for RG `OES`.

**Decided:** Frontend = React 19 + TS + Vite · Mapping = **Azure Maps** (Entra/MI, no key) ·
Agent service = **Python (FastAPI) + Microsoft Agent Framework on Azure OpenAI** ·
Hosting = **Azure App Service** · Data = **Cosmos DB (serverless)** for seed data + trace ledger.

## 8. Working agreements

- All agents read `.github/copilot-instructions.md` first.
- Use `@conductor` to route; `@executor` builds only IN DEMO stories.
- Security baseline is non-negotiable: **RBAC + Managed Identity, no secrets.**

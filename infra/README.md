# OES Infrastructure (Bicep)

RG-scoped Bicep for the demo. Everything deploys into resource group **`OES`** in
subscription `sub_dev` (`8b724cc4-21a9-4131-a67f-08978c02078b`), region **East US 2**,
on **Azure Commercial**.

## Security baseline (non-negotiable)

- **Managed Identity + RBAC only.** No keys, secrets, connection strings, or SAS tokens.
- Disable local/shared-key auth on every resource that supports it (Cosmos, Storage, Maps).
- Least-privilege role assignments scoped to the `OES` resource group.
- GitHub → Azure via OIDC federation (F7); no stored credentials.

## Resources (defined in F3)

- App Service (system-assigned managed identity) — hosts web + agent service
- Azure OpenAI — agent reasoning (role: Cognitive Services OpenAI User)
- Cosmos DB (serverless) — seed data + decision-trace ledger (role: Cosmos DB Data Contributor)
- Azure Maps — COP canvas (role: Azure Maps Data Reader)
- Log Analytics + Application Insights — telemetry/traces

## Deploy

```bash
az deployment group create -g OES -f infra/main.bicep -p @infra/main.parameters.json
```

## Status

Scaffold only (F1). Resource definitions land in F3 (`docs/backlog.md`).

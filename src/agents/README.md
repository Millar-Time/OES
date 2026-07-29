# OES Agent Service

Python (FastAPI) + **Microsoft Agent Framework** service. Hosts the Mission Orchestrator and
specialist agents; reasons on **Azure OpenAI**; persists seed data + the decision-trace ledger
in **Cosmos DB**. All external systems are **mocked** behind the tool interface (`app/tools`).

## Run (dev)

```bash
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
az login                                          # local auth via your identity
copy .env.example .env                            # endpoints only — no keys
uvicorn app.main:app --reload --port 8000
```

Health check: `GET http://localhost:8000/api/health`

## Auth — non-negotiable

- **RBAC + Managed Identity only.** No keys, secrets, or connection strings.
- Azure OpenAI, Cosmos, and Azure Maps are all accessed via `DefaultAzureCredential`
  (managed identity in Azure; developer identity locally).

## Layout

- `app/main.py` — FastAPI app + endpoints
- `app/orchestrator.py` — Mission Orchestrator (F4)
- `app/tools/` — tool interface + mock connectors over seeded data
- `app/config.py` — endpoint config (no secrets)

## Status

Scaffold only (F1). Orchestrator + specialists wired in F4; see `docs/backlog.md`.

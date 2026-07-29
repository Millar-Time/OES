# OES Web (Common Operating Picture)

React 19 + TypeScript + Vite front end. Renders the COP on **Azure Maps** and drives the
golden-path demo UI (incident card, recommendation panel, decision-trace view).

## Run (dev)

```bash
npm install
cp .env.example .env      # endpoints only — no keys
npm run dev
```

## Auth

- **No map key in the browser.** Azure Maps is authenticated with Entra ID tokens tied to
  the app's managed identity; the token is minted server-side by the agent service.
- API calls go to the FastAPI agent service (`/api`, proxied in dev).

## Status

Scaffold only (F1). Map canvas lands in F5; incident/recommendation/trace surfaces follow the
backlog (`docs/backlog.md`).

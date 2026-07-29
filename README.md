# OES — Firefighting Resource Mobilization Platform (Demo)

Demonstration platform for the California Governor's Office of Emergency Services (Cal OES)
**Firefighting Resource Mobilization Platform** — RFI No. A261018369.

> **Scope:** This repository holds the demo build. It is a vertical slice of the
> proposed platform, not the full solution. See the user-story backlog for what is
> **In Demo** vs. **Stretch** vs. **Out of Scope**.

## The demo thesis

Show the **downstream mobilization gap** being closed — signal in → fused common
operating picture → recommendation → human-approved order → auditable decision trace.
Detection is a solved, crowded space; the demo does not rebuild it.

A single **wind-driven incident** scenario drives the whole demo. Every *In Demo*
story advances that one narrative.

## Golden path

1. Incoming signal fused into one common operating picture (COP)
2. Decision-support agent proposes an initial response
3. Resource-recommendation agent returns ranked, drawdown-aware options
4. Human approves (human-in-the-loop, Level 1–2 autonomy)
5. Order synced via a mock IROC/IRWIN interface
6. Every step written to an immutable decision-trace ledger

## Repository layout

```
OES/
├─ docs/     Planning artifacts (design notes, references)
├─ src/      Application code
├─ infra/    Azure infrastructure-as-code
├─ data/     Seeded / mock data for the golden path
└─ README.md
```

> The user-story backlog (`demo_user_stories.xlsx`) is kept on OneDrive for sharing,
> not committed here.

## Status

Scaffolding stage — tech stack to be confirmed. Nothing built yet.

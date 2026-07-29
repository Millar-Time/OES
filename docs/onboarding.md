# Onboarding & Contributing — OES Demo

How to get set up and contribute to the OES Firefighting Resource Mobilization demo.

## 1. Get access

- **GitHub**: Ask the repo owner (@Millar-Time) to add you as a **collaborator** on
  `github.com/Millar-Time/OES` (repo → Settings → Collaborators). Use **your own** GitHub
  account — do not share the owner's credentials.
- **Azure**: To deploy or run against Azure, ask for an **RBAC role on resource group `OES`**
  (subscription `sub_dev`, tenant = Microsoft). Typical: `Contributor` on the RG for
  infra work, plus data-plane roles (Cognitive Services OpenAI User, Cosmos DB Data
  Contributor, Azure Maps Data Reader). **No keys or connection strings are ever shared** —
  access is via your identity / managed identity (see `.github/copilot-instructions.md`).
- **Backlog (Excel)**: the full story backlog `demo_user_stories.xlsx` lives on the owner's
  OneDrive — ask to be shared on it. The build-task view is in-repo at `docs/backlog.md`.

## 2. Prerequisites

- **Node.js 20+** (web) · **Python 3.11+** (agent service) · **Azure CLI** (`az`)
- **VS Code** + the **GitHub Copilot** extension (to use the `@agents`)
- Git configured with **your own** name/email

## 3. Clone & run locally

```bash
git clone https://github.com/Millar-Time/OES.git
cd OES

# Web
cd src/web
npm install
copy .env.example .env        # endpoints only — no keys
npm run dev                    # http://localhost:5173

# Agent service (new terminal)
cd src/agents
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
az login                       # local auth uses YOUR identity
copy .env.example .env         # endpoints only — no keys
uvicorn app.main:app --reload --port 8000   # http://localhost:8000/api/health
```

## 4. How the agents help

This repo ships a Copilot agent team in `.github/agents/`. Open the repo in VS Code with
Copilot and drive the build with them — they all read `.github/copilot-instructions.md`
and `.github/agents/project-context.md` first, so they share the locked context.

- `@conductor` — routes your request to the right agent
- `@planner` — turns a story into tasks (roadmap is `docs/backlog.md`)
- `@architect` — designs the piece before you build it
- `@executor` — implements (TDD); build only **IN DEMO** stories
- `@security-agent` / `@pre-deploy-gate` — enforce RBAC + Managed Identity, no secrets
- `@devops-agent` — Bicep + GitHub Actions (OIDC), deploy to RG `OES`
- `@excalidraw` / `@mermaid` — diagrams

## 5. Pick up work

1. Read `docs/plan.md` (what we're building) and `docs/backlog.md` (task list + dependencies).
2. Claim a task whose dependencies are already done. Independent tasks ready now: **F2**
   (seed data), **F3** (Bicep infra), **F5** (Azure Maps web shell).
3. Create a branch: `git checkout -b <yourname>/<task-id>` (e.g. `rahul/f2-data-seed`).
4. Build it with `@executor`; keep to the golden path — don't widen scope.
5. Open a **Pull Request** into `main`. Do not push to `main` directly.

## 6. Non-negotiables (see copilot-instructions.md)

- **RBAC + Managed Identity only.** No secrets, keys, connection strings, or SAS tokens —
  in code, config, or pipelines. `.env` files hold **endpoints only** and are git-ignored.
- **Azure Commercial**, RG `OES`, region **East US 2**.
- All external systems (IROC, IRWIN, CAD, AVL, weather) are **mocked** for the demo.
- **Synthetic data only** — no real incident data, PII, or CJI.

## 7. Team task tracking

`docs/backlog.md` is the shared roadmap. For live multi-person tracking, promote it to
**GitHub Issues** (one per task, labels per phase) so assignees and status are visible to
everyone — ask the owner to enable Issues and seed them from the backlog.

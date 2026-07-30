# OES Platform — UX North-Star & Design Principles

> Every story we build is measured against this. If a feature makes the
> experience more like IROC/WebEOC (dense, form-driven, analyst-only) we've gone
> wrong. If it makes a stressed coordinator faster and more confident with less
> training, we're on target.

## Who we design for

**Primary persona — Tom Brills**, Operational Area Coordinator, Justice County.
Under pressure during a red-flag wind event, often at 2 a.m., making
mutual-aid mobilization decisions that get second-guessed later. He is *not* a
GIS analyst. He needs to decide fast and defend the decision afterward.

## The problem with today's tools (what we refuse to copy)

- **The swivel-chair problem** — coordinators juggle 5–7 disconnected systems
  (CAD, IROC, an Esri map, weather, phone, email), copying between them by hand.
  Fragmentation is the #1 usability killer.
- **Legacy / form-heavy** (IROC, WebEOC, WildCAD-E) — transactional, code-driven,
  steep training, no visual context.
- **Map-centric but analyst-oriented** (Technosylva, Esri) — powerful, but they
  *show data* instead of *guiding a decision*; someone has to build the dashboard.
- **No decision guidance, no AI assist, bolt-on approvals, rigid config.**

## The modern bar we hold ourselves to

Genasys Zonehaven, Perimeter, Tablet Command, and modern AI-911 (Prepared,
Carbyne): clean, map-first, real-time, touch-friendly, minimal training.

## Design principles

1. **One pane, COP-first.** The map *is* the app. The common operating picture
   is the home surface; everything else is context or drill-down on it. No
   swivel-chair.
2. **Decision-guided, not data-dump.** Lead with the recommendation and the
   *why*. The system does the cognitive load; the human judges. Raw data is
   available on demand, never the default.
3. **Explainable by default.** Every recommendation shows rationale, confidence,
   and data lineage (US-23). If we can't explain it, we don't surface it.
4. **Human-in-the-loop is first-class.** Approve / modify / override is one
   glance and one click (US-20/21), never buried. Autonomy is configurable per
   resource type, and the human is always the authority.
5. **Conversational as a primary input.** A coordinator can just *ask*
   (US-18) — "what engines are available in Region II within 30 minutes?" —
   instead of learning a query syntax.
6. **Progressive disclosure.** Clean, calm top layer for the coordinator;
   depth underneath for analysts who want the model internals.
7. **Trustworthy under pressure.** Legible at 2 a.m.: high contrast, light/dark,
   large targets, status by color + label (never color alone), no dead ends.
8. **Adaptable without a vendor ticket.** No-code rules/config (US-09) so
   policy changes happen in-product.
9. **Auditable after the fact.** An immutable decision trace (US-24) so any
   order can be defended and reconstructed later.
10. **Interop, don't replace.** Fit into the existing system-of-record flow
    (IROC/IRWIN, US-25) rather than forcing a rip-and-replace.

## How each demo story expresses a principle

| Story | Principle it proves |
| --- | --- |
| US-01 fused COP | One pane, COP-first |
| US-03 weather / red-flag | Context on the decision, not a separate tab |
| US-04 initial response | Decision-guided (recommendation + why) |
| US-06 ranked orders | Options with tradeoffs, not a blank form |
| US-07 drawdown guardrail | System prevents unsafe decisions |
| US-10 escalation | Guided next step, not manual re-keying |
| US-18 assistant | Conversational as primary input |
| US-20/21 autonomy + approve | Human-in-the-loop, first-class |
| US-23 explainability | Explainable by default |
| US-24 trace | Auditable after the fact |
| US-09 config | Adaptable without a ticket |
| US-25 IROC/IRWIN | Interop, don't replace |

## Visual language (implemented)

- Modern, calm, information-dense-but-not-cluttered; system font stack.
- **Light and dark themes**, persisted; the map basemap follows the theme.
- Status is always **color + text label** (accessibility): available (green),
  committed (red), assigned (amber).
- Confidence shown as a meter + number, never a bare percentage.

## Demo success test (Aug 12)

A viewer with no training watches Tom go from *ignition → fused picture →
recommended response → approved order → auditable trace* in a few minutes and
says: **"I understood every step, and I trust it."**

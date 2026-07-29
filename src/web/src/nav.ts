/**
 * Demo navigation model — mirrors Tom Brills' decision flow for the Ridgeline
 * Fire. Each view maps to one or more IN-DEMO user stories so a presenter can
 * walk the platform tab by tab. `live: true` means the view is wired to real
 * data; the rest are honest placeholders until their story is built.
 */
export interface NavItem {
  id: string;
  label: string;
  stories: string[];
  live?: boolean;
  blurb: string;
}

export const NAV: NavItem[] = [
  {
    id: "cop",
    label: "Common Picture",
    stories: ["US-01", "US-03", "US-11"],
    live: true,
    blurb: "Fused incident, red-flag weather, and live resource availability on one map.",
  },
  {
    id: "initial-response",
    label: "Initial Response",
    stories: ["US-04"],
    blurb: "Auto-generated initial attack recommendation the moment the incident is confirmed.",
  },
  {
    id: "orders",
    label: "Resource Orders",
    stories: ["US-06", "US-07"],
    blurb: "Ranked resource orders with the operational-area drawdown guardrail enforced.",
  },
  {
    id: "escalation",
    label: "Escalation",
    stories: ["US-10"],
    blurb: "Four-tier escalation from local mutual aid to statewide, with rationale at each step.",
  },
  {
    id: "assistant",
    label: "Assistant",
    stories: ["US-18"],
    blurb: "Conversational assistant grounded in the operating picture and seeded data.",
  },
  {
    id: "autonomy",
    label: "Autonomy & Approvals",
    stories: ["US-20", "US-21"],
    blurb: "Per-resource-type autonomy levels with human approve / override as a first-class step.",
  },
  {
    id: "trace",
    label: "Decision Trace",
    stories: ["US-23", "US-24"],
    blurb: "Explainable recommendations backed by an immutable, append-only decision ledger.",
  },
  {
    id: "interop",
    label: "Interop (IROC/IRWIN)",
    stories: ["US-25"],
    blurb: "Mock two-way sync with IROC / IRWIN using synthetic order and resource records.",
  },
  {
    id: "config",
    label: "Config / Statewide",
    stories: ["US-09", "US-15"],
    blurb: "No-code configuration of rules and the statewide digital-twin rollup.",
  },
];

export interface Story {
  id: string;
  title: string;
  phase: string;
  status: "live" | "planned";
  desc: string;
}

/** The 15 IN-DEMO user stories (docs/backlog.md). `status: live` = wired to real
 * data in the running demo; `planned` = on the Aug 12 build roadmap. */
export const STORIES: Story[] = [
  { id: "US-01", title: "Fused common operating picture", phase: "COP + Recommendation", status: "live",
    desc: "Fuse 3+ mock feeds (CAD, camera, satellite) into one live incident on the map." },
  { id: "US-03", title: "Red-flag weather context", phase: "COP + Recommendation", status: "live",
    desc: "Red-flag warning + wind vector on the incident card from seeded NWS data." },
  { id: "US-04", title: "Decision-support initial response", phase: "COP + Recommendation", status: "live",
    desc: "Auto-generated initial-attack recommendation with a one-line rationale." },
  { id: "US-06", title: "Ranked resource orders", phase: "COP + Recommendation", status: "live",
    desc: "2–3 ranked orders with confidence, rationale, and drawdown impact." },
  { id: "US-07", title: "Drawdown guardrail", phase: "COP + Recommendation", status: "live",
    desc: "Enforce operational-area minimums — block or flag breaching recommendations." },
  { id: "US-11", title: "Availability polling", phase: "Interop / Twin", status: "live",
    desc: "Mark seeded units confirmed / soft-reserved as orders are approved." },
  { id: "US-23", title: "Explainable recommendations", phase: "COP + Recommendation", status: "planned",
    desc: "Every recommendation carries rationale, confidence %, and data/rule lineage." },
  { id: "US-21", title: "Approve / modify / override", phase: "Governance / HITL", status: "planned",
    desc: "Human-in-the-loop control over any agent action, with the decision logged." },
  { id: "US-20", title: "Autonomy levels", phase: "Governance / HITL", status: "planned",
    desc: "Set autonomy per resource type (engines L2, aircraft L1); behavior differs." },
  { id: "US-24", title: "Immutable decision trace", phase: "Governance / HITL", status: "planned",
    desc: "Ordered, timestamped, actor-attributed decision-trace ledger view." },
  { id: "US-10", title: "Four-tier escalation", phase: "Governance / HITL", status: "planned",
    desc: "Mutual-aid escalation OA → Region → State encoded with rationale at each step." },
  { id: "US-09", title: "No-code configuration", phase: "Governance / HITL", status: "planned",
    desc: "Configure drawdown / escalation thresholds; live recommendation updates." },
  { id: "US-25", title: "IROC / IRWIN interop", phase: "Interop / Twin", status: "planned",
    desc: "Place approved order via a mock IROC/IRWIN interface and show it synced." },
  { id: "US-15", title: "Statewide digital twin", phase: "Interop / Twin", status: "planned",
    desc: "Statewide map of units, readiness, and coverage that updates on order." },
  { id: "US-18", title: "Conversational assistant", phase: "Interop / Twin", status: "planned",
    desc: "Assistant over the COP grounded in the live incident and inventory." },
];

export function UserStoriesView() {
  const live = STORIES.filter((s) => s.status === "live").length;
  return (
    <div className="stories-view">
      <div className="arch-head">
        <div>
          <h2>Demo user stories</h2>
          <p className="muted small">
            The 15 stories in scope for the Cal OES demo · <b>{live} live</b>, {STORIES.length - live} on the roadmap.
          </p>
        </div>
      </div>
      <div className="stories-grid">
        {STORIES.map((s) => (
          <div key={s.id} className={`card story-card ${s.status === "live" ? "story-live" : ""}`}>
            <div className="story-top">
              <span className="mono story-id">{s.id}</span>
              <span className={`badge ${s.status === "live" ? "badge-ok" : ""}`}>
                {s.status === "live" ? "Live" : "Planned"}
              </span>
            </div>
            <h3 className="story-title">{s.title}</h3>
            <p className="muted small">{s.desc}</p>
            <span className="story-phase">{s.phase}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

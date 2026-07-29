import type { Incident } from "./api";

/** US-01 / US-03 — the fused incident summary card. */
export function IncidentCard({ incident }: { incident: Incident | null }) {
  if (!incident) return <div className="card">Loading incident…</div>;
  const pct = Math.round(incident.confidence * 100);
  return (
    <div className="card">
      <div className="card-head">
        <h2>{incident.name}</h2>
        <span className="badge badge-status">{incident.status}</span>
      </div>
      <dl className="kv">
        <dt>Incident ID</dt>
        <dd>{incident.incident_id}</dd>
        <dt>Threatened</dt>
        <dd>{incident.threatened_community ?? "—"}</dd>
        <dt>Operational area</dt>
        <dd>{incident.operational_area} · Region {incident.mutual_aid_region}</dd>
        <dt>Fused from</dt>
        <dd>{incident.fused_from.join(", ")} ({incident.feed_count} feeds)</dd>
        <dt>Confidence</dt>
        <dd>
          <div className="meter"><span style={{ width: `${pct}%` }} /></div>
          {pct}%
        </dd>
        <dt>First detected</dt>
        <dd>{new Date(incident.first_detected_utc).toLocaleString()}</dd>
      </dl>
    </div>
  );
}

import { useEffect, useState } from "react";
import { api, type Recommendation } from "./api";

const TIER_CLASS: Record<string, string> = {
  "Operational Area": "tier-oa",
  "Mutual Aid Region II": "tier-region",
  "State (Cal OES)": "tier-state",
};

/** US-04 — Initial Response. The platform's first decision-guided surface:
 * lead with the recommended package + the rationale, human approves/overrides. */
export function InitialResponseView() {
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<string | null>(null);

  useEffect(() => {
    api.initialResponse().then(setRec).catch((e) => setError(String(e)));
  }, []);

  if (error) return <div className="placeholder-view"><div className="card">Error: {error}</div></div>;
  if (!rec) return <div className="placeholder-view"><div className="card">Generating recommendation…</div></div>;

  const pct = Math.round(rec.confidence * 100);
  const pkgSummary = Object.entries(rec.requested_package)
    .map(([t, c]) => `${c} ${t.replace("_", " ")}`)
    .join(" · ");

  return (
    <div className="ir-view">
      {/* Decision banner — the recommendation leads, per the north-star. */}
      <div className="ir-banner">
        <div className="ir-banner-main">
          <span className="ir-eyebrow">Recommended initial response · US-04</span>
          <h2>{rec.incident_name}</h2>
          <p className="ir-pkg">{pkgSummary}</p>
          <p className="muted">
            Threatening <b>{rec.threatened_community}</b> · OA {rec.operational_area}
          </p>
        </div>
        <div className="ir-conf">
          <div className="meter meter-lg"><span style={{ width: `${pct}%` }} /></div>
          <span className="ir-conf-num">{pct}%</span>
          <span className="muted">confidence</span>
        </div>
      </div>

      <div className="ir-grid">
        {/* Assignments — each with ETA + rationale */}
        <div className="card">
          <div className="card-head"><h2>Recommended assignments</h2>
            <span className="badge">{rec.assignments.length} resources</span></div>
          <table className="ir-table">
            <thead>
              <tr><th>Unit</th><th>Type</th><th>ETA</th><th>Tier</th><th>Why</th></tr>
            </thead>
            <tbody>
              {rec.assignments.map((a) => (
                <tr key={a.id}>
                  <td className="mono">{a.id}</td>
                  <td>{a.type.replace("_", " ")}</td>
                  <td className="mono">{a.eta_min}m</td>
                  <td><span className={`tier ${TIER_CLASS[a.tier] ?? ""}`}>{a.tier}</span></td>
                  <td className="muted small">{a.home_unit} · {a.distance_km} km</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rec.unfilled.length > 0 && (
            <p className="ir-unfilled">⚠ Unfilled: {rec.unfilled.map((u) => `${u.filled}/${u.requested} ${u.type}`).join(", ")}</p>
          )}
        </div>

        {/* Why panel — explainability (US-23 foundation) */}
        <div className="card ir-why">
          <div className="card-head"><h2>Why this recommendation</h2></div>
          <p className="ir-rationale">{rec.rationale}</p>
          <h3 className="ir-sub">Drivers</h3>
          <ul className="ir-drivers">
            {rec.drivers.map((d) => (
              <li key={d.factor}>
                <span className="drv-factor">{d.factor}</span>
                <span className="drv-value">{d.value}</span>
                <span className="muted small">{d.impact}</span>
              </li>
            ))}
          </ul>
          <h3 className="ir-sub">Data lineage</h3>
          <p className="muted small">
            Incident fused from {Array.isArray(rec.lineage.incident) ? (rec.lineage.incident as string[]).join(", ") : "—"} ·
            Weather: {String(rec.lineage.weather)}
          </p>
        </div>
      </div>

      {/* Human-in-the-loop — first-class approve/modify/override (US-21 foundation) */}
      <div className="ir-actions">
        {decision ? (
          <span className="ir-decision">Decision recorded: <b>{decision}</b> (demo — trace ledger lands in US-24)</span>
        ) : (
          <>
            <button className="btn btn-approve" onClick={() => setDecision("Approved")}>✓ Approve order</button>
            <button className="btn" onClick={() => setDecision("Modified")}>Modify</button>
            <button className="btn btn-ghost" onClick={() => setDecision("Overridden")}>Override</button>
          </>
        )}
      </div>
    </div>
  );
}

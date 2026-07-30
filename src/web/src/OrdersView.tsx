import { useEffect, useState } from "react";
import { api, type Orders, type OrderOption, type DrawdownArea } from "./api";

const TIER_CLASS: Record<string, string> = {
  "Operational Area": "tier-oa",
  "Mutual Aid Region II": "tier-region",
  "State (Cal OES)": "tier-state",
};

const DD_CLASS: Record<string, string> = {
  OK: "dd-ok",
  AT_MIN: "dd-atmin",
  BREACH: "dd-breach",
};

function DrawdownStrip({ areas }: { areas: DrawdownArea[] }) {
  return (
    <div className="dd-strip">
      {areas.map((a) => (
        <div key={a.oa} className={`dd-chip ${DD_CLASS[a.status]}`} title={`${a.name}: ${a.engines_remaining}/${a.min_engines} engines, ${a.hand_crews_remaining}/${a.min_hand_crews} crews`}>
          <span className="dd-oa">{a.name}</span>
          <span className="dd-status">{a.status.replace("_", " ")}</span>
          <span className="dd-nums">{a.engines_remaining}/{a.min_engines}E · {a.hand_crews_remaining}/{a.min_hand_crews}C</span>
        </div>
      ))}
    </div>
  );
}

function OptionCard({ opt, onSelect, selected }: { opt: OrderOption; onSelect: () => void; selected: boolean }) {
  const breach = opt.drawdown.any_breach;
  return (
    <div className={`card ord-card ${opt.recommended ? "ord-rec" : ""} ${selected ? "ord-selected" : ""}`}>
      <div className="card-head">
        <div>
          <span className="ir-eyebrow">Option {opt.rank}{opt.recommended ? " · Recommended" : ""}</span>
          <h2>{opt.name}</h2>
        </div>
        {breach ? <span className="badge badge-danger">Drawdown breach</span>
          : <span className="badge badge-ok">Coverage protected</span>}
      </div>
      <p className="muted small">{opt.strategy}</p>

      <div className="ord-metrics">
        <div><span className="ord-num">{opt.assignments.length}</span><span className="muted small">resources</span></div>
        <div><span className="ord-num">{opt.avg_eta_min}m</span><span className="muted small">avg ETA</span></div>
        <div><span className="ord-num">{opt.max_eta_min}m</span><span className="muted small">max ETA</span></div>
      </div>

      <table className="ir-table">
        <thead><tr><th>Unit</th><th>Type</th><th>ETA</th><th>Tier</th></tr></thead>
        <tbody>
          {opt.assignments.map((a) => (
            <tr key={a.id}>
              <td className="mono">{a.id}</td>
              <td>{a.type.replace("_", " ")}</td>
              <td className="mono">{a.eta_min}m</td>
              <td><span className={`tier ${TIER_CLASS[a.tier] ?? ""}`}>{a.tier}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      {opt.unfilled.length > 0 && (
        <p className="ir-unfilled">⚠ Underfilled: {opt.unfilled.map((u) => `${u.filled}/${u.requested} ${u.type.replace("_", " ")}`).join(", ")}</p>
      )}

      <h3 className="ir-sub">Statewide coverage after this order</h3>
      <DrawdownStrip areas={opt.drawdown.areas} />

      {opt.escalation_recommended && (
        <p className="ord-escalate">↑ Local + Region II can't fill the package — escalate to State mutual aid.</p>
      )}

      <button className={`btn ${opt.recommended ? "btn-approve" : ""}`} onClick={onSelect}>
        {selected ? "✓ Selected" : `Select "${opt.name}"`}
      </button>
    </div>
  );
}

/** US-06 / US-07 — Ranked resource orders with the drawdown guardrail.
 * The system presents options, protects OA coverage, and recommends the safe
 * order — but the human chooses, and can escalate to State. */
export function OrdersView() {
  const [orders, setOrders] = useState<Orders | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [escalated, setEscalated] = useState(false);

  useEffect(() => {
    api.orders().then(setOrders).catch((e) => setError(String(e)));
  }, []);

  if (error) return <div className="placeholder-view"><div className="card">Error: {error}</div></div>;
  if (!orders) return <div className="placeholder-view"><div className="card">Ranking order options…</div></div>;

  const pkgSummary = Object.entries(orders.requested_package)
    .map(([t, c]) => `${c} ${t.replace("_", " ")}`)
    .join(" · ");

  return (
    <div className="ir-view">
      <div className="ir-banner">
        <div className="ir-banner-main">
          <span className="ir-eyebrow">Resource orders · US-06 / US-07</span>
          <h2>{orders.incident_name}</h2>
          <p className="ir-pkg">Requested package: {pkgSummary}</p>
          <p className="muted">{orders.recommended_rationale}</p>
        </div>
      </div>

      <div className="ord-grid">
        {orders.options.map((opt) => (
          <OptionCard
            key={opt.name}
            opt={opt}
            selected={selected === opt.name}
            onSelect={() => setSelected(opt.name)}
          />
        ))}
      </div>

      <div className="ir-actions">
        {selected ? (
          <span className="ir-decision">
            Order recorded: <b>{selected}</b> (demo — trace ledger lands in US-24)
          </span>
        ) : (
          <span className="muted">Select an order option above to proceed.</span>
        )}
        {escalated ? (
          <span className="ir-decision">↑ Escalation to State mutual aid requested (US-10).</span>
        ) : (
          <button className="btn btn-ghost" onClick={() => setEscalated(true)}>Escalate to State</button>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { api, type Trace, type TraceEntry } from "./api";

const ACTION_CLASS: Record<string, string> = {
  "incident.detected": "act-detect",
  "weather.assessed": "act-weather",
  "recommendation.generated": "act-reco",
  "order.approve": "act-approve",
  "order.override": "act-override",
  "order.modify": "act-modify",
};

function shortHash(h: string): string {
  return h ? `${h.slice(0, 8)}…${h.slice(-6)}` : "";
}

function fmtTs(ts: string): string {
  const d = new Date(ts);
  return isNaN(d.getTime()) ? ts : d.toLocaleString();
}

function EntryRow({ e }: { e: TraceEntry }) {
  const details = Object.entries(e.details ?? {}).filter(([, v]) =>
    v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0),
  );
  return (
    <div className="trace-entry">
      <div className="trace-seq">#{e.seq}</div>
      <div className="trace-body">
        <div className="trace-line1">
          <span className={`act-chip ${ACTION_CLASS[e.action] ?? ""}`}>{e.action}</span>
          <span className="trace-target">{e.target}</span>
          <span className="trace-ts">{fmtTs(e.ts)}</span>
        </div>
        <div className="trace-actor">{e.actor}</div>
        <p className="trace-rationale">{e.rationale}</p>
        {details.length > 0 && (
          <div className="trace-details">
            {details.map(([k, v]) => (
              <span key={k} className="trace-kv">
                <b>{k.replace(/_/g, " ")}:</b> {Array.isArray(v) ? v.join(", ") : String(v)}
              </span>
            ))}
          </div>
        )}
        <div className="trace-hashes">
          <span title={`prev: ${e.prev_hash}`}>prev {shortHash(e.prev_hash)}</span>
          <span className="trace-arrow">→</span>
          <span title={`hash: ${e.entry_hash}`}>hash {shortHash(e.entry_hash)}</span>
        </div>
      </div>
    </div>
  );
}

/** US-23 / US-24 — the immutable, hash-chained decision-trace ledger.
 * Every system inference and human decision is recorded in order with its
 * rationale; each entry chains to the previous by hash, so the whole record is
 * tamper-evident. This is the audit trail an after-action review needs. */
export function TraceView() {
  const [trace, setTrace] = useState<Trace | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => api.trace().then(setTrace).catch((e) => setError(String(e)));
  useEffect(() => { load(); }, []);

  if (error) return <div className="placeholder-view"><div className="card">Error: {error}</div></div>;
  if (!trace) return <div className="placeholder-view"><div className="card">Loading decision trace…</div></div>;

  const intact = trace.integrity.intact;

  return (
    <div className="ir-view">
      <div className="ir-banner">
        <div className="ir-banner-main">
          <span className="ir-eyebrow">Decision trace · US-23 / US-24</span>
          <h2>Immutable decision ledger</h2>
          <p className="muted">
            Append-only, hash-chained record of every system inference and human decision —
            tamper-evident and ordered.
          </p>
        </div>
        <div className="trace-integrity">
          <span className={`badge ${intact ? "badge-ok" : "badge-danger"}`}>
            {intact ? "✓ Chain verified" : `⚠ Tampered at #${trace.integrity.broken_at}`}
          </span>
          <span className="muted small">{trace.integrity.count} entries</span>
          <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
        </div>
      </div>

      <div className="trace-list">
        {trace.entries.map((e) => <EntryRow key={e.seq} e={e} />)}
      </div>
    </div>
  );
}

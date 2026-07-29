import type { Resource } from "./api";

const STATUS_CLASS: Record<string, string> = {
  available: "dot-available",
  committed: "dot-committed",
  assigned: "dot-assigned",
};

/** Seeded resource inventory list (US-11 availability picture). */
export function ResourcePanel({ resources }: { resources: Resource[] }) {
  const available = resources.filter((r) => r.status === "available").length;
  return (
    <div className="card">
      <div className="card-head">
        <h2>Resources</h2>
        <span className="badge">{available}/{resources.length} available</span>
      </div>
      <ul className="res-list">
        {resources.map((r) => (
          <li key={r.id}>
            <span className={`dot ${STATUS_CLASS[r.status] ?? ""}`} />
            <span className="res-id">{r.id}</span>
            <span className="res-type">{r.type}</span>
            <span className="res-oa">{r.oa}</span>
            <span className="res-status">{r.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * OES Common Operating Picture — shell.
 * F5 will mount the Azure Maps canvas here (auth via Entra token from the
 * agent service, never a shared map key). For now this is the scaffold layout.
 */
export function App() {
  return (
    <div style={{ fontFamily: "Segoe UI, Arial, sans-serif", padding: 24 }}>
      <h1>OES — Common Operating Picture</h1>
      <p>Firefighting Resource Mobilization Platform (demo scaffold).</p>
      <ul>
        <li>Map canvas (Azure Maps) — coming in F5 / US-01</li>
        <li>Incident card — US-01 / US-03</li>
        <li>Recommendation panel — US-04 / US-06 / US-23</li>
        <li>Decision-trace view — US-24</li>
      </ul>
    </div>
  );
}

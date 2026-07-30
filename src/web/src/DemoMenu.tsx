import { useEffect, useRef, useState } from "react";
import { ArchitectureView, DIAGRAMS } from "./ArchitectureView";
import { UserStoriesView } from "./UserStoriesView";

type Overlay =
  | { kind: "architecture"; diagramId: string }
  | { kind: "stories" }
  | { kind: "scenario" }
  | null;

function ScenarioView() {
  return (
    <div className="stories-view scenario-view">
      <div className="arch-head">
        <div>
          <h2>Scenario brief</h2>
          <p className="muted small">The single narrative the demo plays out — all fictional & synthetic.</p>
        </div>
      </div>
      <div className="stories-grid">
        <div className="card">
          <h3 className="story-title">Tom Brills — the human in the loop</h3>
          <p className="muted small">
            Operational Area Fire &amp; Rescue Coordinator (Duty Chief), Justice County. He approves,
            modifies, or overrides every agent recommendation and holds the autonomy dial.
          </p>
        </div>
        <div className="card">
          <h3 className="story-title">Justice County (JUS) · Region II</h3>
          <p className="muted small">
            Fictional NorCal county. Seat: Faircourt (OA EOC). Neighbors Liberty (LIB) &amp; Union (UNI).
            Escalation ladder: Local → OA → Region II → State (Cal OES).
          </p>
        </div>
        <div className="card">
          <h3 className="story-title">Ridgeline Fire → Cedar Hollow</h3>
          <p className="muted small">
            New ignition above Ridgeline Road under a red-flag warning, driving toward Cedar Hollow —
            a ~4,200-resident WUI town directly downwind.
          </p>
        </div>
        <div className="card">
          <h3 className="story-title">The tension</h3>
          <p className="muted small">
            Regional spare capacity is thin. The fastest order strips Justice County below safe
            coverage; the safe order underfills and forces an escalation to State mutual aid.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Presenter's DEMO toolkit — architecture diagrams, user stories, and the
 * scenario brief, separate from Tom's operational tabs. */
export function DemoMenu() {
  const [open, setOpen] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); setOverlay(null); }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onEsc); };
  }, []);

  function pick(o: Overlay) { setOverlay(o); setOpen(false); }

  return (
    <div className="demo-menu" ref={ref}>
      <button className="demo-btn" onClick={() => setOpen((v) => !v)} aria-haspopup="true" aria-expanded={open}>
        ★ DEMO
      </button>

      {open && (
        <div className="demo-dropdown" role="menu">
          <div className="demo-group">Architecture overview</div>
          {DIAGRAMS.map((d) => (
            <button key={d.id} className="demo-item" role="menuitem"
              onClick={() => pick({ kind: "architecture", diagramId: d.id })}>
              <span className="demo-item-label">{d.label}</span>
              <span className="demo-item-sub">{d.blurb}</span>
            </button>
          ))}
          <div className="demo-sep" />
          <div className="demo-group">Reference</div>
          <button className="demo-item" role="menuitem" onClick={() => pick({ kind: "stories" })}>
            <span className="demo-item-label">User stories</span>
            <span className="demo-item-sub">The 15 stories in scope, live vs. planned.</span>
          </button>
          <button className="demo-item" role="menuitem" onClick={() => pick({ kind: "scenario" })}>
            <span className="demo-item-label">Scenario brief</span>
            <span className="demo-item-sub">Persona, place, and the narrative the demo plays out.</span>
          </button>
        </div>
      )}

      {overlay && (
        <div className="demo-overlay" role="dialog" aria-modal="true">
          <div className="demo-overlay-bar">
            <div className="demo-overlay-tabs">
              {overlay.kind === "architecture" && DIAGRAMS.map((d) => (
                <button key={d.id}
                  className={`demo-tab ${overlay.diagramId === d.id ? "demo-tab-active" : ""}`}
                  onClick={() => setOverlay({ kind: "architecture", diagramId: d.id })}>
                  {d.label}
                </button>
              ))}
              {overlay.kind === "stories" && <span className="demo-overlay-title">Demo user stories</span>}
              {overlay.kind === "scenario" && <span className="demo-overlay-title">Scenario brief</span>}
            </div>
            <button className="demo-close" onClick={() => setOverlay(null)} aria-label="Close">✕</button>
          </div>
          <div className="demo-overlay-body">
            {overlay.kind === "architecture" && <ArchitectureView diagramId={overlay.diagramId} />}
            {overlay.kind === "stories" && <UserStoriesView />}
            {overlay.kind === "scenario" && <ScenarioView />}
          </div>
        </div>
      )}
    </div>
  );
}

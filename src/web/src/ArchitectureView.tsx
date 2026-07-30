import { lazy, Suspense, useEffect, useState } from "react";
import "@excalidraw/excalidraw/index.css";
import { getTheme } from "./ThemeToggle";

// Excalidraw is heavy; keep it out of the main bundle.
const Excalidraw = lazy(() =>
  import("@excalidraw/excalidraw").then((m) => ({ default: m.Excalidraw }))
);

export interface Diagram {
  id: string;
  label: string;
  file: string;
  blurb: string;
}

export const DIAGRAMS: Diagram[] = [
  {
    id: "arch_reference",
    label: "Solution Architecture",
    file: "/diagrams/arch_reference.excalidraw",
    blurb: "End-to-end platform: fused feeds → Agent Framework orchestrator → COP, on Azure with RBAC + Managed Identity.",
  },
  {
    id: "flow_reference",
    label: "Decision Flow",
    file: "/diagrams/flow_reference.excalidraw",
    blurb: "Tom Brills' decision journey — detect, fuse, recommend, guardrail, approve, escalate, trace.",
  },
  {
    id: "caloes_repro",
    label: "Reference Architecture",
    file: "/diagrams/caloes_repro.excalidraw",
    blurb: "Cal OES reference / current-state context the platform integrates with.",
  },
  {
    id: "value_flow",
    label: "Value Flow",
    file: "/diagrams/value_flow.excalidraw",
    blurb: "How the platform turns raw signals into a defensible, audited resource decision.",
  },
];

export function ArchitectureView({ diagramId }: { diagramId?: string }) {
  const [scene, setScene] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const active = DIAGRAMS.find((d) => d.id === diagramId) ?? DIAGRAMS[0];
  const theme = getTheme();

  useEffect(() => {
    setScene(null);
    setError(null);
    fetch(active.file)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => setScene(data))
      .catch((e) => setError(String(e)));
  }, [active.file]);

  return (
    <div className="arch-view">
      <div className="arch-head">
        <div>
          <h2>{active.label}</h2>
          <p className="muted small">{active.blurb}</p>
        </div>
      </div>
      <div className="arch-canvas">
        {error && <div className="card">Couldn't load diagram: {error}</div>}
        {!error && !scene && <div className="card">Loading diagram…</div>}
        {!error && scene && (
          <Suspense fallback={<div className="card">Rendering…</div>}>
            <Excalidraw
              initialData={{
                elements: (scene.elements as never) ?? [],
                appState: { viewBackgroundColor: theme === "dark" ? "#0f1115" : "#ffffff" },
                scrollToContent: true,
              }}
              viewModeEnabled
              theme={theme}
              UIOptions={{ canvasActions: { toggleTheme: false, export: false, saveToActiveFile: false, loadScene: false } }}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { api, type AssistantAnswer } from "./api";

interface Turn {
  role: "user" | "assistant";
  text: string;
  answer?: AssistantAnswer;
}

const STARTERS = [
  "Summarize the incident",
  "What's the weather driving this?",
  "How many resources are available?",
  "What's the recommended initial attack?",
  "Show the ranked resource orders",
  "When do we escalate to mutual aid?",
];

const INTENT_LABEL: Record<string, string> = {
  incident: "Incident", weather: "Weather", resources: "Resources",
  recommendation: "Initial attack", orders: "Resource orders", drawdown: "Drawdown",
  escalation: "Escalation", trace: "Decision trace", help: "Assistant", fallback: "Situation",
};

/** Minimal **bold** rendering so grounded emphasis survives without a markdown dep. */
function renderMarkish(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>,
  );
}

/** US-18 — the reusable assistant chat: thread, grounded answers with source
 * chips, and suggested follow-ups. Rendered inside the global slide-out dock so
 * it behaves identically on every tab. */
export function AssistantChat() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  async function send(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    setTurns((t) => [...t, { role: "user", text: q }]);
    setBusy(true);
    try {
      const answer = await api.ask(q);
      setTurns((t) => [...t, { role: "assistant", text: answer.answer, answer }]);
    } catch (e) {
      setTurns((t) => [...t, { role: "assistant", text: `Sorry — I couldn't reach the service (${String(e)}).` }]);
    } finally {
      setBusy(false);
    }
  }

  const lastAnswer = [...turns].reverse().find((t) => t.answer)?.answer;
  const suggestions = lastAnswer?.suggestions ?? STARTERS.slice(0, 3);

  return (
    <div className="asst-chat">
      <div className="asst-thread" ref={scrollRef}>
        {turns.length === 0 && (
          <div className="asst-empty">
            <p className="muted">Try one of these to get started:</p>
            <div className="asst-chips">
              {STARTERS.map((s) => (
                <button key={s} className="asst-chip" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {turns.map((t, i) => (
          <div key={i} className={`asst-msg asst-${t.role}`}>
            <div className="asst-bubble">
              {t.role === "assistant" && t.answer && (
                <span className="asst-intent">{INTENT_LABEL[t.answer.intent] ?? t.answer.intent}</span>
              )}
              <p className="asst-text">{renderMarkish(t.text)}</p>
              {t.answer && t.answer.facts.length > 0 && (
                <div className="asst-facts">
                  {t.answer.facts.map((f, j) => (
                    <span key={j} className="asst-fact"><b>{f.label}</b> {f.value}</span>
                  ))}
                </div>
              )}
              {t.answer && t.answer.sources.length > 0 && (
                <div className="asst-sources">
                  <span className="asst-sources-label">Grounded in</span>
                  {t.answer.sources.map((s) => <span key={s} className="asst-source">{s}</span>)}
                </div>
              )}
            </div>
          </div>
        ))}

        {busy && (
          <div className="asst-msg asst-assistant">
            <div className="asst-bubble"><p className="asst-text asst-typing">Thinking…</p></div>
          </div>
        )}
      </div>

      {turns.length > 0 && (
        <div className="asst-suggests">
          {suggestions.map((s) => (
            <button key={s} className="asst-chip" onClick={() => send(s)} disabled={busy}>{s}</button>
          ))}
        </div>
      )}

      <form className="asst-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <input
          type="text"
          value={input}
          placeholder="Ask about the incident, weather, resources, orders…"
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
        />
        <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()}>Ask</button>
      </form>
    </div>
  );
}

/** US-18 — global slide-out dock. A launcher button (bottom-right) is present on
 * every tab; clicking it slides a panel in from the right holding the grounded
 * assistant, so the coordinator can ask questions without leaving the map,
 * orders, or trace they're looking at. */
export function AssistantDock() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        className={`asst-fab ${open ? "asst-fab-open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : "Ask the assistant"}
        title={open ? "Close assistant" : "Ask the assistant"}
      >
        {open ? "✕" : <><span className="asst-fab-icon">💬</span><span className="asst-fab-label">Ask</span></>}
      </button>

      <aside className={`asst-dock ${open ? "asst-dock-open" : ""}`} aria-hidden={!open}>
        <div className="asst-dock-head">
          <div>
            <span className="ir-eyebrow">Assistant · US-18</span>
            <h3>Ask the operating picture</h3>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} aria-label="Close">✕</button>
        </div>
        <p className="asst-dock-sub muted small">
          Grounded in the live incident, weather, inventory, orders, escalation and decision
          ledger — every answer cites its sources.
        </p>
        {open && <AssistantChat />}
      </aside>
    </>
  );
}

import { Component, type ReactNode } from "react";

interface Props { children: ReactNode }
interface State { error: Error | null }

/** App-level error boundary. Without this, any uncaught render error makes React
 * unmount the whole tree — a blank white page with no clue why. Here we catch it
 * and show the message (and log the stack to the console) so failures are
 * diagnosable in the hosted demo instead of silently blanking. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("OES app crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24, fontFamily: "system-ui, sans-serif", background: "#0f1720", color: "#e6edf3",
        }}>
          <div style={{ maxWidth: 560 }}>
            <h1 style={{ fontSize: 20, margin: "0 0 8px" }}>Something went wrong</h1>
            <p style={{ color: "#8ba0b3", margin: "0 0 12px" }}>
              The app hit an unexpected error while loading. Details below (also in the console):
            </p>
            <pre style={{
              whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#17212b",
              border: "1px solid #263443", borderRadius: 8, padding: 12, fontSize: 12,
            }}>{String(this.state.error?.stack || this.state.error?.message || this.state.error)}</pre>
            <button
              onClick={() => location.reload()}
              style={{
                marginTop: 12, padding: "8px 16px", borderRadius: 8, border: "1px solid #2f81f7",
                background: "#2f81f7", color: "#fff", cursor: "pointer", fontFamily: "inherit",
              }}
            >Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

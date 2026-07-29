/**
 * OES Common Operating Picture — F5 shell.
 * App-level navigation walks Tom Brills' decision flow for the Ridgeline Fire.
 * The Common Picture view (US-01/03/11) is live; other tabs are honest
 * placeholders naming their stories until each is built.
 */
import { useState } from "react";
import { NAV } from "./nav";
import { NavRail } from "./NavRail";
import { CopView } from "./CopView";
import { Placeholder } from "./Placeholder";
import { ThemeToggle } from "./ThemeToggle";
import "./styles.css";

export function App() {
  const [active, setActive] = useState("cop");
  const item = NAV.find((n) => n.id === active) ?? NAV[0];

  return (
    <div className="app">
      <header className="topbar">
        <h1>OES — Common Operating Picture</h1>
        <span className="sub">Firefighting Resource Mobilization Platform · Justice County demo</span>
        <ThemeToggle />
      </header>
      <div className="shell">
        <NavRail active={active} onSelect={setActive} />
        <main className="content">
          {item.id === "cop" ? <CopView /> : <Placeholder item={item} />}
        </main>
      </div>
    </div>
  );
}

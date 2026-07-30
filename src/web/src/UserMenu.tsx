import { useEffect, useRef, useState } from "react";
import type { AccountInfo } from "@azure/msal-browser";
import { msalInstance, authConfigured } from "./authConfig";

function initials(name?: string): string {
  if (!name) return "?";
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** Signed-in user chip + sign out. Renders nothing when auth isn't configured. */
export function UserMenu() {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authConfigured) setAccount(msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0] ?? null);
    function onDoc(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!authConfigured || !account) return null;
  const claims = account.idTokenClaims as Record<string, unknown> | undefined;
  const name = (claims?.name as string) || account.username;

  return (
    <div className="user-menu" ref={ref}>
      <button className="user-chip" onClick={() => setOpen((v) => !v)} title={name} aria-label="Account">
        {initials(name)}
      </button>
      {open && (
        <div className="user-dropdown">
          <div className="user-info">
            <div className="user-name">{name}</div>
            <div className="muted small">{account.username}</div>
          </div>
          <div className="demo-sep" />
          <button className="demo-item" onClick={() => msalInstance.logoutRedirect({ account })}>
            <span className="demo-item-label">Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}

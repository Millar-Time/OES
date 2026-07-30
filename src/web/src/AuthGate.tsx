import { useEffect, useState } from "react";
import type { AccountInfo } from "@azure/msal-browser";
import {
  msalInstance,
  loginRequest,
  authConfigured,
  isAuthorized,
  groupOverage,
  JC_DEMO_GROUP_ID,
} from "./authConfig";
import { ThemeToggle } from "./ThemeToggle";

type Phase = "loading" | "signedout" | "authorized" | "denied";

/** Resolve group membership via Graph when the token omits the groups claim
 * (overage). Uses the delegated User.Read token already consented at sign-in. */
async function checkGroupViaGraph(account: AccountInfo): Promise<boolean> {
  try {
    const res = await msalInstance.acquireTokenSilent({ ...loginRequest, account });
    const r = await fetch("https://graph.microsoft.com/v1.0/me/checkMemberGroups", {
      method: "POST",
      headers: { Authorization: `Bearer ${res.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ groupIds: [JC_DEMO_GROUP_ID] }),
    });
    const data = await r.json();
    return Array.isArray(data.value) && data.value.includes(JC_DEMO_GROUP_ID);
  } catch {
    return false;
  }
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-screen">
      <div className="auth-topbar"><ThemeToggle /></div>
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-mark">🔥</span>
          <div>
            <h1>OES</h1>
            <p className="muted">Firefighting Resource Mobilization Platform</p>
          </div>
        </div>
        {children}
        <p className="auth-foot muted small">Justice County demo · secured with Microsoft Entra ID</p>
      </div>
    </div>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>(authConfigured ? "loading" : "authorized");
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authConfigured) return;
    (async () => {
      await msalInstance.initialize();
      const result = await msalInstance.handleRedirectPromise();
      const acct = result?.account ?? msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0] ?? null;
      if (!acct) { setPhase("signedout"); return; }
      msalInstance.setActiveAccount(acct);
      setAccount(acct);
      let ok = isAuthorized(acct);
      if (!ok && groupOverage(acct)) ok = await checkGroupViaGraph(acct);
      setPhase(ok ? "authorized" : "denied");
    })();
  }, []);

  async function signIn() {
    setBusy(true);
    try { await msalInstance.loginRedirect(loginRequest); }
    catch { setBusy(false); }
  }

  function signOut() {
    msalInstance.logoutRedirect({ account: account ?? undefined });
  }

  if (phase === "authorized") return <>{children}</>;

  if (phase === "loading") {
    return <Shell><p className="muted">Checking your access…</p></Shell>;
  }

  if (phase === "denied") {
    const name = (account?.idTokenClaims as Record<string, unknown> | undefined)?.name as string | undefined;
    return (
      <Shell>
        <div className="auth-denied">
          <h2>Access denied</h2>
          <p className="muted">
            {name ? `Signed in as ${name}, but your` : "Your"} account isn't a member of the
            <b> JC-Demo</b> group required for this demo.
          </p>
          <p className="muted small">Ask the demo owner to add you to JC-Demo, then sign in again.</p>
          <button className="btn" onClick={signOut}>Sign out</button>
        </div>
      </Shell>
    );
  }

  // signedout
  return (
    <Shell>
      <button className="btn btn-signin" onClick={signIn} disabled={busy}>
        {busy ? "Redirecting…" : "Sign in with Microsoft"}
      </button>
      <p className="muted small">Access is limited to members of the JC-Demo security group.</p>
    </Shell>
  );
}

import { PublicClientApplication, type AccountInfo, type Configuration } from "@azure/msal-browser";

const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID as string | undefined;
const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID as string | undefined;
export const JC_DEMO_GROUP_ID = (import.meta.env.VITE_JC_DEMO_GROUP_ID as string | undefined) ?? "";

/** Auth is only enforced when the Entra app is configured. If the env vars are
 * missing (e.g. a contributor without the app registration) the app runs open,
 * so local development never hard-blocks on auth setup. */
export const authConfigured = Boolean(tenantId && clientId);

const msalConfig: Configuration = {
  auth: {
    clientId: clientId ?? "unconfigured",
    authority: `https://login.microsoftonline.com/${tenantId ?? "common"}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: { cacheLocation: "sessionStorage" },
};

export const msalInstance = new PublicClientApplication(msalConfig);

// ID-token only; groups claim rides along via the app's SecurityGroup config.
export const loginRequest = { scopes: ["openid", "profile", "User.Read"] };

/** Group object ids from the ID token, if present. Empty when the user is in
 * too many groups (Entra emits an overage link instead) — see groupOverage. */
export function groupsFromAccount(account: AccountInfo | null): string[] {
  const claims = account?.idTokenClaims as Record<string, unknown> | undefined;
  const groups = claims?.groups;
  return Array.isArray(groups) ? (groups as string[]) : [];
}

/** True when Entra replaced the groups claim with an overage link (>200 groups),
 * so membership must be resolved via Graph rather than the token. */
export function groupOverage(account: AccountInfo | null): boolean {
  const claims = account?.idTokenClaims as Record<string, unknown> | undefined;
  return Boolean(claims?._claim_names && (claims._claim_names as Record<string, unknown>).groups);
}

export function isAuthorized(account: AccountInfo | null): boolean {
  if (!JC_DEMO_GROUP_ID) return true; // no gate configured
  return groupsFromAccount(account).includes(JC_DEMO_GROUP_ID);
}

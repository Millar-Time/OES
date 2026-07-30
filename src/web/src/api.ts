/**
 * Typed client for the OES agent service.
 * All calls go through the Vite dev proxy (`/api` -> FastAPI) so the browser
 * never needs the API host or any credential.
 */

export interface Incident {
  incident_id: string;
  name: string;
  type: string;
  threatened_community: string | null;
  operational_area: string;
  mutual_aid_region: string;
  centroid: { lat: number; lon: number };
  confidence: number;
  fused_from: string[];
  feed_count: number;
  first_detected_utc: string;
  status: string;
}

export interface Resource {
  id: string;
  type: string;
  name: string;
  oa: string;
  status: string;
  lat: number;
  lon: number;
  [key: string]: unknown;
}

export interface Weather {
  red_flag_warning?: { active: boolean; headline?: string; valid_to_utc?: string };
  observation?: {
    temp_f?: number;
    relative_humidity_pct?: number;
    wind?: { direction_cardinal?: string; sustained_mph?: number; gust_mph?: number };
    fuel_moisture_pct?: number;
    haines_index?: number;
  };
  escalation_risk?: string;
  office?: string;
  [key: string]: unknown;
}

export interface Assignment {
  id: string;
  type: string;
  home_unit: string;
  oa: string;
  tier: string;
  distance_km: number;
  eta_min: number;
  rationale: string;
}

export interface Driver {
  factor: string;
  value: string;
  impact: string;
}

export interface Recommendation {
  incident_id: string;
  incident_name: string;
  threatened_community: string | null;
  operational_area: string;
  requested_package: Record<string, number>;
  assignments: Assignment[];
  unfilled: { type: string; requested: number; filled: number }[];
  drivers: Driver[];
  confidence: number;
  rationale: string;
  lineage: Record<string, unknown>;
}

export interface MapsToken {
  available: boolean;
  access_token?: string;
  expires_on?: number;
  reason?: string;
}

export interface OrderAssignment {
  id: string;
  type: string;
  home_unit: string;
  oa: string;
  tier: string;
  distance_km: number;
  eta_min: number;
}

export interface DrawdownArea {
  oa: string;
  name: string;
  engines_remaining: number;
  min_engines: number;
  hand_crews_remaining: number;
  min_hand_crews: number;
  status: "OK" | "AT_MIN" | "BREACH";
}

export interface OrderOption {
  name: string;
  strategy: string;
  assignments: OrderAssignment[];
  unfilled: { type: string; requested: number; filled: number }[];
  max_eta_min: number;
  avg_eta_min: number;
  drawdown: { any_breach: boolean; areas: DrawdownArea[] };
  escalation_recommended: boolean;
  rank: number;
  recommended: boolean;
}

export interface Orders {
  incident_id: string;
  incident_name: string;
  operational_area: string;
  requested_package: Record<string, number>;
  options: OrderOption[];
  recommended_rationale: string;
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return (await res.json()) as T;
}

export const api = {
  incident: () => getJSON<Incident>("/api/incident"),
  resources: (oa?: string) =>
    getJSON<Resource[]>("/api/resources" + (oa ? `?oa=${encodeURIComponent(oa)}` : "")),
  weather: () => getJSON<Weather>("/api/weather"),
  initialResponse: () => getJSON<Recommendation>("/api/recommendation/initial"),
  orders: () => getJSON<Orders>("/api/orders"),
  async mapsToken(): Promise<MapsToken> {
    // Token endpoint is configurable: on the hosted SWA (Free tier, no MI in
    // built-in functions) it points at a standalone Consumption Function App;
    // locally it falls back to the FastAPI service via the dev proxy.
    const url = import.meta.env.VITE_MAPS_TOKEN_URL || "/api/maps/token";
    const res = await fetch(url);
    return (await res.json()) as MapsToken;
  },
};

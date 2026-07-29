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
  [key: string]: unknown;
}

export interface MapsToken {
  available: boolean;
  access_token?: string;
  expires_on?: number;
  reason?: string;
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
  async mapsToken(): Promise<MapsToken> {
    const res = await fetch("/api/maps/token");
    return (await res.json()) as MapsToken;
  },
};

/**
 * Azure Maps Common Operating Picture canvas.
 *
 * Auth model: the browser holds NO map key. It authenticates the map with a
 * short-lived Entra token fetched from the agent service (/api/maps/token),
 * which is minted by the app's managed identity. If Azure Maps isn't
 * provisioned yet (F3) or you're not logged in (`az login`), the canvas shows a
 * graceful placeholder instead of failing — the incident/resource panels still
 * work off the API.
 */
import { useEffect, useRef, useState } from "react";
import * as atlas from "azure-maps-control";
import "azure-maps-control/dist/atlas.min.css";
import { api, type Incident, type Resource } from "./api";

const STATUS_COLOR: Record<string, string> = {
  available: "#2e7d32",
  committed: "#c62828",
  assigned: "#ef6c00",
};

function mapStyleForTheme(): string {
  const t = document.documentElement.getAttribute("data-theme");
  return t === "light" ? "road_shaded_relief" : "grayscale_dark";
}

export function MapCanvas({ incident, resources }: { incident: Incident | null; resources: Resource[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<atlas.Map | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);

  // Create the map once, authenticated via the service-minted Entra token.
  useEffect(() => {
    let disposed = false;

    (async () => {
      const tok = await api.mapsToken();
      if (disposed) return;
      if (!tok.available) {
        setUnavailable(tok.reason ?? "Azure Maps not available");
        return;
      }

      const map = new atlas.Map(ref.current!, {
        center: incident ? [incident.centroid.lon, incident.centroid.lat] : [-122.9, 38.72],
        zoom: 9,
        style: mapStyleForTheme(),
        authOptions: {
          authType: atlas.AuthenticationType.anonymous,
          clientId: import.meta.env.VITE_AZURE_MAPS_CLIENT_ID || "oes-demo",
          getToken: async (resolve, reject) => {
            try {
              const t = await api.mapsToken();
              if (t.available && t.access_token) resolve(t.access_token);
              else reject(t.reason ?? "no token");
            } catch (e) {
              reject(String(e));
            }
          },
        },
      });
      mapRef.current = map;
    })();

    return () => {
      disposed = true;
      mapRef.current?.dispose();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restyle the map basemap when the app theme toggles.
  useEffect(() => {
    const target = document.documentElement;
    const obs = new MutationObserver(() => {
      mapRef.current?.setStyle({ style: mapStyleForTheme() });
    });
    obs.observe(target, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  // Render markers whenever incident/resources change and the map is ready.
  // HtmlMarkers are DOM overlays, so they survive basemap restyles (theme
  // toggles) — unlike style layers, which a setStyle() call would drop.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers: atlas.HtmlMarker[] = [];

    const draw = () => {
      for (const m of markers) map.markers.remove(m);
      markers.length = 0;

      for (const r of resources) {
        const color = STATUS_COLOR[r.status] ?? "#616161";
        const marker = new atlas.HtmlMarker({
          position: [r.lon, r.lat],
          htmlContent: `<div class="mk-res" style="background:${color}" title="${r.id} · ${r.type} · ${r.status}"></div>`,
        });
        markers.push(marker);
        map.markers.add(marker);
      }

      if (incident) {
        const inc = new atlas.HtmlMarker({
          position: [incident.centroid.lon, incident.centroid.lat],
          htmlContent: `<div class="mk-incident" title="${incident.name}"><span class="mk-pulse"></span>🔥<b>${incident.name}</b></div>`,
        });
        markers.push(inc);
        map.markers.add(inc);
        map.setCamera({ center: [incident.centroid.lon, incident.centroid.lat], zoom: 10 });
      }
    };

    map.events.add("ready", draw);
    return () => {
      for (const m of markers) map.markers.remove(m);
    };
  }, [incident, resources]);

  if (unavailable) {
    return (
      <div className="map-placeholder">
        <strong>Map canvas offline</strong>
        <p>{unavailable}</p>
        <p>Provision Azure Maps (infra F3) and run <code>az login</code> to enable the live map. Incident and resource data below are live.</p>
      </div>
    );
  }

  return <div ref={ref} className="map-canvas" />;
}

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

// Ridgeline Fire perimeter footprint. Synthetic for the golden-path scenario —
// an irregular polygon elongated toward the SW (the offshore NE wind pushes the
// head downslope). In production this ring is fed live from an authoritative
// wildfire feed (NIFC / Esri Living Atlas WFIGS current perimeters); the render
// path here is identical — only the data source changes.
const FIRE_SRC_ID = "ridgeline-fire-src";
const FIRE_RING_OFFSETS: [number, number][] = [
  [-0.028, -0.020], // head (SW)
  [-0.018, -0.027],
  [-0.006, -0.021],
  [0.005, -0.011],
  [0.011, 0.0], // right flank (E)
  [0.007, 0.011],
  [0.0, 0.017], // back (NE)
  [-0.011, 0.015],
  [-0.019, 0.006],
  [-0.025, -0.005],
  [-0.028, -0.020], // close ring
];

function fireRing(lon: number, lat: number): atlas.data.Position[] {
  return FIRE_RING_OFFSETS.map(([dLon, dLat]) => [lon + dLon, lat + dLat]);
}

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

  // Draw the wildfire perimeter as map layers, and re-add it after every
  // basemap restyle (setStyle drops sources + layers, so we re-run on the
  // "styledata" event). Rendered beneath the DOM HtmlMarkers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !incident) return;

    const ensureFire = () => {
      if (map.sources.getById(FIRE_SRC_ID)) return;
      const src = new atlas.source.DataSource(FIRE_SRC_ID);
      map.sources.add(src);
      src.add(
        new atlas.data.Feature(
          new atlas.data.Polygon([fireRing(incident.centroid.lon, incident.centroid.lat)]),
        ),
      );
      map.layers.add(
        new atlas.layer.PolygonLayer(src, "ridgeline-fire-fill", {
          fillColor: "rgba(214, 40, 40, 0.22)",
        }),
      );
      map.layers.add(
        new atlas.layer.LineLayer(src, "ridgeline-fire-line", {
          strokeColor: "#c62828",
          strokeWidth: 2,
          strokeDashArray: [2, 1],
        }),
      );
    };

    map.events.add("ready", ensureFire);
    map.events.add("styledata", ensureFire);
    ensureFire();

    return () => {
      map.events.remove("ready", ensureFire);
      map.events.remove("styledata", ensureFire);
      for (const id of ["ridgeline-fire-fill", "ridgeline-fire-line"]) {
        const layer = map.layers.getLayerById(id);
        if (layer) map.layers.remove(layer);
      }
      const src = map.sources.getById(FIRE_SRC_ID);
      if (src) map.sources.remove(src as atlas.source.DataSource);
    };
  }, [incident]);

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

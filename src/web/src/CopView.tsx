import { useEffect, useState } from "react";
import { api, type Incident, type Resource, type Weather } from "./api";
import { MapCanvas } from "./MapCanvas";
import { IncidentCard } from "./IncidentCard";
import { WeatherCard } from "./WeatherCard";
import { ResourcePanel } from "./ResourcePanel";

/** US-01 / US-03 / US-11 — the live Common Operating Picture. */
export function CopView() {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [inc, res, wx] = await Promise.all([api.incident(), api.resources(), api.weather()]);
        setIncident(inc);
        setResources(res);
        setWeather(wx);
      } catch (e) {
        setError(String(e));
      }
    })();
  }, []);

  return (
    <div className="cop-layout">
      <aside className="sidebar">
        {error && <div className="card">API error: {error}. Is the agent service running on :8000?</div>}
        <IncidentCard incident={incident} />
        <WeatherCard weather={weather} />
        <ResourcePanel resources={resources} />
      </aside>
      <MapCanvas incident={incident} resources={resources} />
    </div>
  );
}

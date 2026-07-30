import type { Weather } from "./api";

/** US-03 — weather + red-flag context, shown on the operating picture (not a
 * separate tab). Context on the decision, per the UX north-star. */
export function WeatherCard({ weather }: { weather: Weather | null }) {
  if (!weather) return null;
  const rf = weather.red_flag_warning;
  const o = weather.observation ?? {};
  const w = o.wind ?? {};
  return (
    <div className="card">
      <div className="card-head">
        <h2>Weather</h2>
        {rf?.active ? <span className="badge badge-redflag">🚩 Red Flag</span> : null}
      </div>
      {rf?.active && rf.headline ? <p className="redflag-headline">{rf.headline}</p> : null}
      <dl className="kv">
        <dt>Temp / RH</dt>
        <dd>{o.temp_f}°F · {o.relative_humidity_pct}% RH</dd>
        <dt>Wind</dt>
        <dd>{w.direction_cardinal} {w.sustained_mph} mph, gusts {w.gust_mph} mph</dd>
        <dt>Fuel moisture</dt>
        <dd>{o.fuel_moisture_pct}%</dd>
        <dt>Risk</dt>
        <dd className="risk-extreme">{String(weather.escalation_risk ?? "").toUpperCase()}</dd>
      </dl>
    </div>
  );
}

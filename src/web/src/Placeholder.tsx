import type { NavItem } from "./nav";

/** Honest placeholder for a demo view not yet built. Names the stories and the
 * intended acceptance so the skeleton is walkable and self-documenting. */
export function Placeholder({ item }: { item: NavItem }) {
  return (
    <div className="placeholder-view">
      <div className="card">
        <div className="card-head">
          <h2>{item.label}</h2>
          <span className="badge">{item.stories.join(" · ")}</span>
        </div>
        <p>{item.blurb}</p>
        <p className="muted">Not yet built. This surface is next in the backlog for its story.</p>
      </div>
    </div>
  );
}

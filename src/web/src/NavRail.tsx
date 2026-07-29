import { NAV, type NavItem } from "./nav";

export function NavRail({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  return (
    <nav className="navrail">
      {NAV.map((item: NavItem) => (
        <button
          key={item.id}
          className={"nav-item" + (item.id === active ? " nav-active" : "")}
          onClick={() => onSelect(item.id)}
          title={item.blurb}
        >
          <span className="nav-label">{item.label}</span>
          <span className="nav-stories">{item.stories.join(" · ")}</span>
          {item.live ? <span className="nav-live" /> : null}
        </button>
      ))}
    </nav>
  );
}

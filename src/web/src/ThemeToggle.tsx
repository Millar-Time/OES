import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

export function getTheme(): Theme {
  return (document.documentElement.getAttribute("data-theme") as Theme) || "dark";
}

/** Topbar light/dark switch. Persists to localStorage and drives the Azure Maps
 * style via the `data-theme` attribute on <html>. */
export function ThemeToggle({ onChange }: { onChange?: (t: Theme) => void }) {
  const [theme, setTheme] = useState<Theme>(getTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("oes-theme", theme);
    onChange?.(theme);
  }, [theme, onChange]);

  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-label="Toggle color theme"
    >
      {theme === "dark" ? "☀ Light" : "☾ Dark"}
    </button>
  );
}

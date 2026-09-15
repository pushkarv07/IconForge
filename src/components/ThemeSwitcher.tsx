"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type ThemeMode = "light" | "system" | "dark";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeMode>("system");

  useEffect(() => {
    const saved = (localStorage.getItem("iconforge-theme") as ThemeMode) ?? "system";
    const mode = saved === "dark" || saved === "light" ? saved : "system";
    setTheme(mode);
    applyTheme(mode);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onMediaChange = () => {
      const current = (localStorage.getItem("iconforge-theme") as ThemeMode) ?? "system";
      if (current === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", onMediaChange);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "iconforge-theme") {
        const next = (e.newValue as ThemeMode) ?? "system";
        setTheme(next);
        applyTheme(next);
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      mediaQuery.removeEventListener("change", onMediaChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  function applyTheme(mode: ThemeMode) {
    const effective =
      mode === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : mode;
    document.documentElement.dataset.theme = effective;
  }

  function updateTheme(next: ThemeMode) {
    setTheme(next);
    localStorage.setItem("iconforge-theme", next);
    applyTheme(next);
  }

  return (
    <div className="theme-switcher" role="radiogroup" aria-label="Theme mode">
      <button
        type="button"
        role="radio"
        aria-checked={theme === "light"}
        className={`theme-btn ${theme === "light" ? "active" : ""}`}
        onClick={() => updateTheme("light")}
        aria-label="Light theme"
      >
        <Sun size={12} className="theme-icon" aria-hidden="true" />
        <span className="theme-text">Light</span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={theme === "system"}
        className={`theme-btn ${theme === "system" ? "active" : ""}`}
        onClick={() => updateTheme("system")}
        aria-label="Auto theme"
      >
        <Monitor size={12} className="theme-icon" aria-hidden="true" />
        <span className="theme-text">Auto</span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={theme === "dark"}
        className={`theme-btn ${theme === "dark" ? "active" : ""}`}
        onClick={() => updateTheme("dark")}
        aria-label="Dark theme"
      >
        <Moon size={12} className="theme-icon" aria-hidden="true" />
        <span className="theme-text">Dark</span>
      </button>
    </div>
  );
}

export default ThemeSwitcher;

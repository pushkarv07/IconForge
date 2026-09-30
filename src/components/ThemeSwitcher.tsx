"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type ThemeMode = "light" | "system" | "dark";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeMode>("system");
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = (localStorage.getItem("iconforge-theme") as ThemeMode) ?? "system";
    const mode = saved === "dark" || saved === "light" ? saved : "system";
    setTheme(mode);
    applyTheme(mode, false);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onMediaChange = () => {
      const current = (localStorage.getItem("iconforge-theme") as ThemeMode) ?? "system";
      if (current === "system") {
        applyTheme("system", true);
      }
    };

    mediaQuery.addEventListener("change", onMediaChange);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "iconforge-theme") {
        const next = (e.newValue as ThemeMode) ?? "system";
        setTheme(next);
        applyTheme(next, true);
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
      document.documentElement.classList.remove("theme-transitioning");
      mediaQuery.removeEventListener("change", onMediaChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  function applyTheme(mode: ThemeMode, animate = false) {
    const effective =
      mode === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : mode;

    const currentEffective = document.documentElement.dataset.theme;

    if (animate && currentEffective && currentEffective !== effective) {
      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (!prefersReduced) {
        if (transitionTimerRef.current) {
          clearTimeout(transitionTimerRef.current);
        }
        document.documentElement.classList.add("theme-transitioning");

        transitionTimerRef.current = setTimeout(() => {
          document.documentElement.classList.remove("theme-transitioning");
          transitionTimerRef.current = null;
        }, 70);
      }
    }

    document.documentElement.dataset.theme = effective;
  }

  function updateTheme(next: ThemeMode) {
    setTheme(next);
    localStorage.setItem("iconforge-theme", next);
    applyTheme(next, true);
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
        title="Light theme"
      >
        <Sun size={13} strokeWidth={1.8} className="theme-icon" aria-hidden="true" />
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={theme === "system"}
        className={`theme-btn ${theme === "system" ? "active" : ""}`}
        onClick={() => updateTheme("system")}
        aria-label="Auto theme"
        title="Auto (system) theme"
      >
        <Monitor size={13} strokeWidth={1.8} className="theme-icon" aria-hidden="true" />
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={theme === "dark"}
        className={`theme-btn ${theme === "dark" ? "active" : ""}`}
        onClick={() => updateTheme("dark")}
        aria-label="Dark theme"
        title="Dark theme"
      >
        <Moon size={13} strokeWidth={1.8} className="theme-icon" aria-hidden="true" />
      </button>
    </div>
  );
}

export default ThemeSwitcher;

"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Download, FolderKanban, Lock, RotateCcw, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { iconPaths } from "@/lib/icons";
import type { IconName } from "@/lib/types";

interface HeroIconItem {
  id: IconName;
  name: string;
}

const HERO_SET: HeroIconItem[] = [
  { id: "cloud-upload", name: "Cloud upload" },
  { id: "shopping-cart", name: "Shopping cart" },
  { id: "search", name: "Search" },
  { id: "camera", name: "Camera" },
  { id: "location", name: "Location" },
  { id: "coffee", name: "Coffee" },
];

interface VariationItem {
  id: string;
  label: string;
  isBestMatch?: boolean;
  svgPath: string;
}

interface PromptSample {
  id: string;
  promptText: string;
  chipLabel: string;
  variations: VariationItem[];
}

const PROMPT_SAMPLES: PromptSample[] = [
  {
    id: "search",
    promptText: "search",
    chipLabel: "search",
    variations: [
      {
        id: "search-1",
        label: "Best match",
        isBestMatch: true,
        svgPath: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
      },
      {
        id: "search-2",
        label: "Geometric",
        svgPath: '<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4.5 4.5"/>',
      },
      {
        id: "search-3",
        label: "Minimal",
        svgPath: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/>',
      },
      {
        id: "search-4",
        label: "Center dot",
        svgPath: '<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4.5 4.5"/><circle cx="11" cy="11" r="1.5"/>',
      },
      {
        id: "search-5",
        label: "Compact",
        svgPath: '<circle cx="10" cy="10" r="6"/><path d="m14.5 14.5 5.5 5.5"/>',
      },
      {
        id: "search-6",
        label: "Outlined",
        svgPath: '<circle cx="11" cy="11" r="7.5"/><path d="m17 17 4 4"/>',
      },
    ],
  },
  {
    id: "cloud-upload",
    promptText: "cloud upload",
    chipLabel: "cloud upload",
    variations: [
      {
        id: "cloud-1",
        label: "Best match",
        isBestMatch: true,
        svgPath: '<path d="M4 14.9A7 7 0 1 1 15.7 8H17.5a4.5 4.5 0 0 1 2.5 8.2"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/>',
      },
      {
        id: "cloud-2",
        label: "Geometric",
        svgPath: '<path d="M5 17h14a4 4 0 0 0 0-8h-.5A7 7 0 0 0 5.1 12.5"/><path d="M12 11v8"/><path d="m9 14 3-3 3 3"/>',
      },
      {
        id: "cloud-3",
        label: "Minimal",
        svgPath: '<path d="M7 16.5A5.5 5.5 0 0 1 12 9a6 6 0 0 1 5.8 4.4A4 4 0 0 1 17 21H7a5 5 0 0 1-.5-9.98"/><path d="M12 13v7"/><path d="m15 16-3-3-3 3"/>',
      },
      {
        id: "cloud-4",
        label: "Compact",
        svgPath: '<path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 0 1 0 9Z"/><path d="M12 13v6"/><path d="m9 16 3-3 3 3"/>',
      },
      {
        id: "cloud-5",
        label: "Smooth",
        svgPath: '<path d="M4 14.8A7 7 0 1 1 15.7 8H17.5a4.5 4.5 0 0 1 2.5 8.2"/><path d="M12 11v9"/><path d="M8.5 14.5 12 11l3.5 3.5"/>',
      },
      {
        id: "cloud-6",
        label: "Outlined",
        svgPath: '<path d="M4.5 15A6.5 6.5 0 0 1 15 8.5h1.5a4.5 4.5 0 0 1 2.5 8.2"/><path d="M12 13v7"/><path d="m9.5 15.5 2.5-2.5 2.5 2.5"/>',
      },
    ],
  },
  {
    id: "shopping-cart",
    promptText: "shopping cart",
    chipLabel: "shopping cart",
    variations: [
      {
        id: "cart-1",
        label: "Best match",
        isBestMatch: true,
        svgPath: '<path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 1.9-1.5L21 8H6"/><circle cx="10" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/>',
      },
      {
        id: "cart-2",
        label: "Minimal",
        svgPath: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
      },
      {
        id: "cart-3",
        label: "Rounded",
        svgPath: '<path d="M2 3h3l2 11h11l2-8H6"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
      },
      {
        id: "cart-4",
        label: "Compact",
        svgPath: '<path d="M4 5h2l1.5 8h10.5l1.5-6H7"/><circle cx="9.5" cy="18.5" r="1.5"/><circle cx="16.5" cy="18.5" r="1.5"/>',
      },
      {
        id: "cart-5",
        label: "Geometric",
        svgPath: '<path d="M3 3h3l1.8 9h11.4l1.8-9H6.5"/><circle cx="9" cy="18" r="1.2"/><circle cx="17" cy="18" r="1.2"/><path d="M7.8 12h11.4"/>',
      },
      {
        id: "cart-6",
        label: "Outlined",
        svgPath: '<path d="M2 4h3.2l2.4 10h10.8l2-7H6.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
      },
    ],
  },
  {
    id: "camera",
    promptText: "camera",
    chipLabel: "camera",
    variations: [
      {
        id: "camera-1",
        label: "Best match",
        isBestMatch: true,
        svgPath: '<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.5"/>',
      },
      {
        id: "camera-2",
        label: "Geometric",
        svgPath: '<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7V5h8v2"/>',
      },
      {
        id: "camera-3",
        label: "Minimal",
        svgPath: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
      },
      {
        id: "camera-4",
        label: "Compact",
        svgPath: '<rect x="2" y="6" width="20" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><circle cx="18" cy="9" r="1"/>',
      },
      {
        id: "camera-5",
        label: "Smooth",
        svgPath: '<path d="M4 7h3.5l1.5-2h6l1.5 2H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="3"/>',
      },
      {
        id: "camera-6",
        label: "Studio",
        svgPath: '<rect x="3" y="7" width="18" height="12" rx="2"/><circle cx="12" cy="13" r="3.2"/><path d="M7 7V5.5h4V7"/>',
      },
    ],
  },
  {
    id: "location",
    promptText: "location",
    chipLabel: "location",
    variations: [
      {
        id: "location-1",
        label: "Best match",
        isBestMatch: true,
        svgPath: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
      },
      {
        id: "location-2",
        label: "Minimal",
        svgPath: '<path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/>',
      },
      {
        id: "location-3",
        label: "Geometric",
        svgPath: '<path d="M12 21s-7-6.5-7-11a7 7 0 1 1 14 0c0 4.5-7 11-7 11Z"/><circle cx="12" cy="10" r="2"/>',
      },
      {
        id: "location-4",
        label: "Beacon",
        svgPath: '<path d="M12 22s-6-5.5-6-10a6 6 0 1 1 12 0c0 4.5-6 10-6 10Z"/><circle cx="12" cy="10" r="2"/>',
      },
      {
        id: "location-5",
        label: "Crosshair",
        svgPath: '<circle cx="12" cy="12" r="8"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="2"/>',
      },
      {
        id: "location-6",
        label: "Smooth",
        svgPath: '<path d="M19 10c0 6-7 12-7 12S5 16 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
      },
    ],
  },
  {
    id: "coffee",
    promptText: "coffee",
    chipLabel: "coffee",
    variations: [
      {
        id: "coffee-1",
        label: "Best match",
        isBestMatch: true,
        svgPath: '<path d="M5 9h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V9Z"/><path d="M17 11h2a3 3 0 0 1 0 6h-2M8 5c0 1 1 1 1 2M12 5c0 1 1 1 1 2"/>',
      },
      {
        id: "coffee-2",
        label: "Minimal",
        svgPath: '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>',
      },
      {
        id: "coffee-3",
        label: "Compact",
        svgPath: '<path d="M4 8h13v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z"/><path d="M17 10h2a2 2 0 0 1 0 4h-2M7 4v2M11 4v2M15 4v2"/>',
      },
      {
        id: "coffee-4",
        label: "Teacup",
        svgPath: '<path d="M3 9h14v5a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9Z"/><path d="M17 11h2a2.5 2.5 0 0 1 0 5h-2M2 20h18"/>',
      },
      {
        id: "coffee-5",
        label: "Takeaway",
        svgPath: '<path d="M6 7h12l-1.5 13h-9L6 7Z"/><path d="M5 4h14v3H5V4ZM9 2h6"/>',
      },
      {
        id: "coffee-6",
        label: "Espresso",
        svgPath: '<path d="M4 10h12v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-4Z"/><path d="M16 12h2a2 2 0 0 1 0 4h-2M7 6c0 1 1 1 1 2M11 6c0 1 1 1 1 2"/>',
      },
    ],
  },
];

interface StyleLockItem {
  id: IconName;
  name: string;
  role: "reference" | "generated" | "mismatch";
}

const STYLELOCK_SET: StyleLockItem[] = [
  { id: "camera", name: "Camera", role: "reference" },
  { id: "shopping-cart", name: "Shopping cart", role: "generated" },
  { id: "search", name: "Search", role: "generated" },
  { id: "cloud-upload", name: "Cloud upload", role: "mismatch" },
  { id: "location", name: "Location", role: "generated" },
  { id: "coffee", name: "Coffee", role: "generated" },
];

interface SetOverviewIcon {
  id: IconName;
  name: string;
}

const SET_OVERVIEW_ICONS: SetOverviewIcon[] = [
  { id: "cloud-upload", name: "Cloud upload" },
  { id: "shopping-cart", name: "Shopping cart" },
  { id: "search", name: "Search" },
  { id: "camera", name: "Camera" },
  { id: "location", name: "Location" },
  { id: "coffee", name: "Coffee" },
];

export default function Home() {
  const [chosen, setChosen] = useState<IconName>("cloud-upload");
  const [activePromptId, setActivePromptId] = useState("search");
  const [selectedVariationIdx, setSelectedVariationIdx] = useState(0);

  // Section 4: Style Lock + Consistency State
  const [isConsistencyFixed, setIsConsistencyFixed] = useState(false);

  // Section 5: Icon Sets + Export State
  const [exportFormat, setExportFormat] = useState<"svg" | "zip">("svg");
  const [exportSuccess, setExportSuccess] = useState(false);

  // Footer: Pushkar photo interaction state
  const [pushkarPhotoOpen, setPushkarPhotoOpen] = useState(false);

  // Close Pushkar photo popup on outside click
  useEffect(() => {
    if (!pushkarPhotoOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest(".pushkar-trigger")) {
        setPushkarPhotoOpen(false);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [pushkarPhotoOpen]);

  // Hero auto-shifting icon animation (4-second cycle, respects prefers-reduced-motion)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setChosen("cloud-upload");
      return;
    }

    const handleMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setChosen("cloud-upload");
      }
    };
    mediaQuery.addEventListener?.("change", handleMotionChange);

    const cycleOrder: IconName[] = [
      "cloud-upload",
      "shopping-cart",
      "search",
      "camera",
      "location",
      "coffee",
    ];

    const interval = setInterval(() => {
      setChosen((prev) => {
        const idx = cycleOrder.indexOf(prev);
        const nextIdx = (idx + 1) % cycleOrder.length;
        return cycleOrder[nextIdx];
      });
    }, 4000);

    return () => {
      clearInterval(interval);
      mediaQuery.removeEventListener?.("change", handleMotionChange);
    };
  }, []);

  const handleExportClick = () => {
    setExportSuccess(true);
    setTimeout(() => {
      setExportSuccess(false);
    }, 2000);
  };

  const currentItem = HERO_SET.find((item) => item.id === chosen) ?? HERO_SET[0];
  const activePromptSample =
    PROMPT_SAMPLES.find((s) => s.id === activePromptId) ?? PROMPT_SAMPLES[0];

  return (
    <main className="app-shell landing">
      <header className="landing-header-sticky">
        <nav className="landing-nav">
          <Link href="/" className="brand">
            <span className="brand-mark">IF</span> IconForge
          </Link>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <ThemeSwitcher />
            <Link href="/sets" className="btn btn-quiet">
              Icon sets
            </Link>
            <Link href="/create" className="btn btn-primary">
              <span>Open workspace</span> <ArrowRight size={15} className="cta-arrow" />
            </Link>
          </div>
        </nav>
      </header>

      <div className="hero">
        <section className="hero-grid">
          <div className="hero-content">
            <div className="eyebrow hero-eyebrow">MAKE IT YOUR WAY</div>
            <h1 className="hero-title">
              Create the icons<br />
              you see in your mind.
            </h1>
            <p className="hero-copy">
              AI-powered icon generation with consistent style across your entire icon set.
            </p>

            <div className="hero-actions">
              <Link href="/create" className="btn btn-primary hero-btn-primary">
                <span>Create an icon</span> <ArrowRight size={15} className="cta-arrow" />
              </Link>
              <Link href="/sets" className="btn hero-btn-secondary">
                Icon sets
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-showcase">
              <div className="showcase-header">
                <span className="showcase-set-title">Design System</span>
                <span className="showcase-set-specs">24 × 24 · 1.5 px outline</span>
              </div>

              <div className="showcase-stage">
                <div className="showcase-artboard">
                  <div className="artboard-corner-tl" />
                  <div className="artboard-corner-tr" />
                  <div className="artboard-corner-bl" />
                  <div className="artboard-corner-br" />
                  <div className="showcase-grid-overlay" />
                  <div className="showcase-icon-float-wrap">
                    <div
                      key={chosen}
                      className="showcase-active-icon"
                      dangerouslySetInnerHTML={{
                        __html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${iconPaths[chosen]}</svg>`,
                      }}
                    />
                  </div>
                </div>
                <div className="showcase-stage-meta">
                  <span className="showcase-icon-name">{currentItem.name}</span>
                  <span className="showcase-meta-dot">•</span>
                  <span>24 × 24</span>
                  <span className="showcase-meta-dot">•</span>
                  <span>1.5 px stroke</span>
                </div>
              </div>

              <div className="showcase-tiles-section">
                <div className="showcase-tiles-header">
                  <span className="showcase-tiles-title">Set members</span>
                  <span className="showcase-tiles-caption">Click to inspect</span>
                </div>
                <div className="showcase-tiles">
                  {HERO_SET.map((item) => {
                    const isSelected = item.id === chosen;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`showcase-tile ${isSelected ? "selected" : ""}`}
                        onClick={() => setChosen(item.id)}
                        aria-label={`Inspect ${item.name}`}
                      >
                        <span
                          className="showcase-tile-icon"
                          dangerouslySetInnerHTML={{
                            __html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${iconPaths[item.id]}</svg>`,
                          }}
                        />
                        <span className="showcase-tile-label">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="landing-bottom">
        {/* Section 2: How It Works */}
        <section className="section-how-it-works" id="how-it-works">
          {/* Subtle Atmospheric Ambient Glow */}
          <div className="how-ambient-glow" aria-hidden="true" />

          <div className="how-it-works-container">
            <div className="how-it-works-header">
              <div className="how-it-works-eyebrow">HOW IT WORKS</div>
              <h2 className="how-it-works-title">
                <span className="how-it-works-title-line">From idea to complete set</span>
                <span className="how-it-works-title-line">in three simple steps.</span>
              </h2>
              <p className="how-it-works-copy">
                A streamlined workflow designed to turn ideas into production-ready, style-consistent vector icons.
              </p>
            </div>

            <div className="how-it-works-grid-wrap">
              <div className="how-progress-line" aria-hidden="true" />

              <div className="how-it-works-grid">
                {/* Card 01 — Start with an idea */}
                <div
                  className="how-it-works-card"
                  tabIndex={0}
                  role="region"
                  aria-label="Step 01: Start with an idea"
                >
                  {/* TOP: Step number, category label, large visual area */}
                  <div className="how-card-top">
                    <div className="how-card-header">
                      <span className="how-step-num">01</span>
                      <span className="how-category-label">IDEA</span>
                    </div>

                    <div className="how-card-visual" aria-hidden="true">
                      <div className="how-emerging-stage">
                        <div className="how-emerging-icon-wrap">
                          <svg
                            width="54"
                            height="54"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="how-emerging-svg"
                          >
                            <path d="M4 14.9A7 7 0 1 1 15.7 8H17.5a4.5 4.5 0 0 1 2.5 8.2" />
                            <path d="M12 12v9" />
                            <path d="m16 16-4-4-4 4" />
                          </svg>
                        </div>
                        <div className="how-emerging-beam" />
                        <div className="how-prompt-field">
                          <Sparkles size={13} className="how-prompt-sparkle" />
                          <span className="how-prompt-input">cloud upload</span>
                          <span className="how-prompt-cursor" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM: Title & short description */}
                  <div className="how-card-bottom">
                    <h3 className="how-card-title">Start with an idea</h3>
                    <p className="how-card-desc">
                      Describe the icon you need with a simple prompt.
                    </p>
                  </div>
                </div>

                {/* Card 02 — Generate your icon */}
                <div
                  className="how-it-works-card"
                  tabIndex={0}
                  role="region"
                  aria-label="Step 02: Generate your icon"
                >
                  {/* TOP: Step number, category label, large visual area */}
                  <div className="how-card-top">
                    <div className="how-card-header">
                      <span className="how-step-num">02</span>
                      <span className="how-category-label">GENERATE</span>
                    </div>

                    <div className="how-card-visual" aria-hidden="true">
                      <div className="how-variations-stage">
                        <div className="how-var-box">
                          <svg
                            width="34"
                            height="34"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M5 17h14a4 4 0 0 0 0-8h-.5A7 7 0 0 0 5.1 12.5" />
                            <path d="M12 11v8" />
                            <path d="m9 14 3-3 3 3" />
                          </svg>
                        </div>
                        <div className="how-var-box selected">
                          <svg
                            width="46"
                            height="46"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M4 14.9A7 7 0 1 1 15.7 8H17.5a4.5 4.5 0 0 1 2.5 8.2" />
                            <path d="M12 12v9" />
                            <path d="m16 16-4-4-4 4" />
                          </svg>
                          <span className="how-var-badge">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        </div>
                        <div className="how-var-box">
                          <svg
                            width="34"
                            height="34"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M7 16.5A5.5 5.5 0 0 1 12 9a6 6 0 0 1 5.8 4.4A4 4 0 0 1 17 21H7a5 5 0 0 1-.5-9.98" />
                            <path d="M12 13v7" />
                            <path d="m15 16-3-3-3 3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM: Title & short description */}
                  <div className="how-card-bottom">
                    <h3 className="how-card-title">Generate your icon</h3>
                    <p className="how-card-desc">
                      Turn your idea into clean SVG variations and choose the direction you like.
                    </p>
                  </div>
                </div>

                {/* Card 03 — Refine your result */}
                <div
                  className="how-it-works-card"
                  tabIndex={0}
                  role="region"
                  aria-label="Step 03: Refine your result"
                >
                  {/* TOP: Step number, category label, large visual area */}
                  <div className="how-card-top">
                    <div className="how-card-header">
                      <span className="how-step-num">03</span>
                      <span className="how-category-label">REFINE</span>
                    </div>

                    <div className="how-card-visual" aria-hidden="true">
                      <div className="how-refine-stage">
                        <div className="how-refine-indicator">
                          <Lock size={11} className="how-refine-lock" />
                          <span className="how-refine-lock-text">Style Lock</span>
                          <span className="how-refine-divider">•</span>
                          <span className="how-refine-score">100 / 100</span>
                        </div>

                        <div className="how-refine-hero-box">
                          <svg
                            width="54"
                            height="54"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M4 14.9A7 7 0 1 1 15.7 8H17.5a4.5 4.5 0 0 1 2.5 8.2" />
                            <path d="M12 12v9" />
                            <path d="m16 16-4-4-4 4" />
                          </svg>
                        </div>

                        <div className="how-refine-badge">
                          <Check size={11} strokeWidth={2.5} />
                          <span>Consistent style</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM: Title & short description */}
                  <div className="how-card-bottom">
                    <h3 className="how-card-title">Refine your result</h3>
                    <p className="how-card-desc">
                      Lock the style, refine the details, and prepare your icon for a complete set.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="how-it-works-cta-wrap">
              <Link href="/create" className="btn btn-primary section-cta-btn">
                <span>Create an icon</span> <ArrowRight size={15} className="cta-arrow" />
              </Link>
            </div>
          </div>
        </section>

        {/* Section 3: Prompt → Icon */}
        <section className="section-prompt-icon" id="prompt-to-icon">
          <div className="prompt-icon-grid">
            <div className="prompt-icon-left">
              <div className="eyebrow prompt-icon-eyebrow">From words to SVG</div>
              <h2 className="prompt-icon-title">
                Describe it.<br />
                Create it.
              </h2>
              <p className="prompt-icon-subtext">
                Turn a simple prompt into clean, editable SVG icons in seconds.
              </p>

              <div className="prompt-icon-pills">
                <span className="prompt-icon-pill">
                  <span className="prompt-pill-dot" />
                  Simple text prompt
                </span>
                <span className="prompt-icon-pill">
                  <span className="prompt-pill-dot" />
                  4–6 instant vector variations
                </span>
                <span className="prompt-icon-pill">
                  <span className="prompt-pill-dot" />
                  Production-ready 24 × 24 SVG
                </span>
              </div>

              <div className="section-cta-wrap">
                <Link href="/create" className="btn btn-primary section-cta-btn">
                  <span>Create an icon</span> <ArrowRight size={15} className="cta-arrow" />
                </Link>
              </div>
            </div>

            <div className="prompt-icon-right">
              <div className="workflow-card">
                <div className="workflow-header">
                  <div className="workflow-header-left">
                    <span className="workflow-header-title">Prompt to SVG</span>
                    <span className="workflow-header-badge">AI Generator</span>
                  </div>
                  <div className="workflow-header-meta">
                    <span>24 × 24 · 1.5 px stroke</span>
                  </div>
                </div>

                <div className="workflow-body">
                  <div className="workflow-input-section">
                    <div className="workflow-input-wrap">
                      <div className="workflow-input-icon">
                        <Sparkles size={14} />
                      </div>
                      <div className="workflow-input-field">
                        <span className="workflow-input-value">{activePromptSample.promptText}</span>
                        <span className="workflow-input-cursor" />
                      </div>
                      <button
                        type="button"
                        className="workflow-generate-btn"
                        onClick={() => {
                          setSelectedVariationIdx((prev) => (prev + 1) % activePromptSample.variations.length);
                        }}
                        aria-label="Generate variations"
                      >
                        <Sparkles size={12} />
                        <span>Generate</span>
                      </button>
                    </div>

                    <div className="workflow-prompt-chips">
                      <span className="workflow-chips-label">Try prompt:</span>
                      {PROMPT_SAMPLES.map((sample) => {
                        const isActive = sample.id === activePromptId;
                        return (
                          <button
                            key={sample.id}
                            type="button"
                            className={`workflow-chip ${isActive ? "active" : ""}`}
                            onClick={() => {
                              setActivePromptId(sample.id);
                              setSelectedVariationIdx(0);
                            }}
                          >
                            {sample.chipLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="workflow-variations-section">
                    <div className="workflow-variations-header">
                      <div className="workflow-variations-title-wrap">
                        <span className="workflow-variations-eyebrow eyebrow-neutral">Generated variations</span>
                        <span className="workflow-variations-count">
                          {activePromptSample.variations.length} candidates
                        </span>
                      </div>
                      <span className="workflow-variations-hint">Click to choose variation</span>
                    </div>

                    <div className="workflow-variations-grid">
                      {activePromptSample.variations.map((variation, idx) => {
                        const isSelected = idx === selectedVariationIdx;
                        return (
                          <button
                            key={variation.id}
                            type="button"
                            className={`workflow-candidate ${isSelected ? "selected" : ""}`}
                            onClick={() => setSelectedVariationIdx(idx)}
                            aria-label={`Select variation ${variation.label}`}
                          >
                            {isSelected && (
                              <div className="workflow-candidate-check" title="Selected variation">
                                <Check size={10} strokeWidth={3} />
                              </div>
                            )}
                            <div className="workflow-candidate-stage">
                              <span
                                className="workflow-candidate-svg"
                                dangerouslySetInnerHTML={{
                                  __html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${variation.svgPath}</svg>`,
                                }}
                              />
                            </div>
                            <div className="workflow-candidate-meta">
                              <span
                                className={`workflow-candidate-badge ${
                                  variation.isBestMatch ? "best-match" : ""
                                }`}
                              >
                                {variation.label}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Style Lock + Consistency */}
        <section className="section-style-consistency" id="style-consistency">
          <div className="stylelock-grid">
            <div className="stylelock-visual">
              <div className="stylelock-card" aria-label="Style lock and consistency workflow">
                <div className="stylelock-card-header">
                  <div className="stylelock-card-header-left">
                    <Lock size={13} className="stylelock-header-icon" />
                    <span className="stylelock-card-title">Consistency Engine</span>
                    <span className="stylelock-header-badge">Style Lock</span>
                  </div>
                  <div className="stylelock-flow-indicators">
                    <span className="stylelock-flow-step active">Lock</span>
                    <span className="stylelock-flow-sep">→</span>
                    <span className="stylelock-flow-step active">Generate</span>
                    <span className="stylelock-flow-sep">→</span>
                    <span className={`stylelock-flow-step ${!isConsistencyFixed ? "active" : ""}`}>Check</span>
                    <span className="stylelock-flow-sep">→</span>
                    <span className={`stylelock-flow-step ${isConsistencyFixed ? "active" : ""}`}>Fix</span>
                  </div>
                </div>

                <div className="stylelock-card-body">
                  <div className="stylelock-view-toggle" role="tablist" aria-label="Consistency preview mode">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={!isConsistencyFixed}
                      className={`stylelock-view-btn ${!isConsistencyFixed ? "active" : ""}`}
                      onClick={() => setIsConsistencyFixed(false)}
                    >
                      <span className="stylelock-dot-mismatch" />
                      <span>73 / 100 · Mismatched</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isConsistencyFixed}
                      className={`stylelock-view-btn ${isConsistencyFixed ? "active" : ""}`}
                      onClick={() => setIsConsistencyFixed(true)}
                    >
                      <span className="stylelock-dot-consistent" />
                      <span>100 / 100 · Consistent</span>
                    </button>
                  </div>

                  <div className="stylelock-tiles-section">
                    <div className="stylelock-tiles-header">
                      <span className="stylelock-tiles-caption">Active icon set (6 members)</span>
                      <span className="stylelock-tiles-ref">
                        <Lock size={11} /> Reference: Camera (1.5 px)
                      </span>
                    </div>

                    <div className="stylelock-tiles-grid">
                      {STYLELOCK_SET.map((item) => {
                        const isRef = item.role === "reference";
                        const isMismatchTarget = item.role === "mismatch";
                        const isCurrentlyMismatched = isMismatchTarget && !isConsistencyFixed;
                        const isCurrentlyFixed = isMismatchTarget && isConsistencyFixed;
                        const strokeVal = isCurrentlyMismatched ? "2.5" : "1.5";

                        let tileClass = "stylelock-tile";
                        if (isRef) tileClass += " reference";
                        else if (isCurrentlyMismatched) tileClass += " mismatched";
                        else if (isCurrentlyFixed) tileClass += " matched";

                        return (
                          <div key={item.id} className={tileClass}>
                            {isRef && (
                              <span className="stylelock-tile-badge locked">
                                Locked
                              </span>
                            )}
                            {isCurrentlyMismatched && (
                              <span className="stylelock-tile-badge mismatch">
                                Mismatch
                              </span>
                            )}
                            {isCurrentlyFixed && (
                              <span className="stylelock-tile-badge fixed">
                                Matched
                              </span>
                            )}

                            <div className="stylelock-tile-stage">
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeVal}" stroke-linecap="round" stroke-linejoin="round">${iconPaths[item.id]}</svg>`,
                                }}
                              />
                            </div>

                            <div className="stylelock-tile-meta">
                              <span className="stylelock-tile-name">{item.name}</span>
                              <span
                                className={`stylelock-tile-spec ${
                                  isCurrentlyMismatched ? "mismatch" : isCurrentlyFixed ? "matched" : ""
                                }`}
                              >
                                {strokeVal} px
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className={`stylelock-diagnostic-bar ${isConsistencyFixed ? "consistent" : "mismatched"}`}>
                    <div className="stylelock-diagnostic-score-wrap">
                      <div className={`stylelock-score-badge ${isConsistencyFixed ? "consistent" : "mismatched"}`}>
                        <span className="stylelock-score-num">{isConsistencyFixed ? "100 / 100" : "73 / 100"}</span>
                        <span className="stylelock-score-status">{isConsistencyFixed ? "CONSISTENT" : "MISMATCHED"}</span>
                      </div>
                      <div className="stylelock-diagnostic-info">
                        <div className="stylelock-diagnostic-title">
                          {isConsistencyFixed ? "All icons uniform" : "Stroke weight varies"}
                        </div>
                        <div className="stylelock-diagnostic-detail">
                          {isConsistencyFixed
                            ? "All 6 icons match reference style (1.5 px stroke, 24 × 24 grid)"
                            : "Cloud upload rendered with 2.5 px stroke (reference requires 1.5 px)"}
                        </div>
                      </div>
                    </div>

                    <div className="stylelock-diagnostic-action">
                      {!isConsistencyFixed ? (
                        <button
                          type="button"
                          className="stylelock-fix-btn"
                          onClick={() => setIsConsistencyFixed(true)}
                          aria-label="Regenerate cloud upload to match reference"
                        >
                          <Sparkles size={12} />
                          <span>Regenerate to Match</span>
                        </button>
                      ) : (
                        <div className="stylelock-fixed-actions">
                          <span className="stylelock-fixed-label">
                            <Check size={13} strokeWidth={3} />
                            <span>Aligned</span>
                          </span>
                          <button
                            type="button"
                            className="stylelock-recheck-btn"
                            onClick={() => setIsConsistencyFixed(false)}
                            aria-label="Re-test mismatch"
                          >
                            <RotateCcw size={11} />
                            <span>Re-check</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="stylelock-text">
              <div className="eyebrow stylelock-eyebrow">Keep the style</div>
              <h2 className="stylelock-title">
                Make every icon feel like it belongs.
              </h2>
              <p className="stylelock-subtext">
                Lock a visual style, generate more icons, and quickly fix anything that feels out of place.
              </p>

              <div className="stylelock-pills">
                <span className="stylelock-pill">
                  <span className="stylelock-pill-dot" />
                  Lock visual style
                </span>
                <span className="stylelock-pill">
                  <span className="stylelock-pill-dot" />
                  Generate matching icons
                </span>
                <span className="stylelock-pill">
                  <span className="stylelock-pill-dot" />
                  Check consistency score
                </span>
                <span className="stylelock-pill">
                  <span className="stylelock-pill-dot" />
                  Regenerate to match
                </span>
              </div>

              <div className="section-cta-wrap">
                <Link href="/create" className="btn btn-primary section-cta-btn">
                  <span>Create an icon</span> <ArrowRight size={15} className="cta-arrow" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Icon Sets + Export */}
        <section className="section-sets-export" id="sets-export">
          <div className="sets-export-grid">
            <div className="sets-export-text">
              <div className="eyebrow sets-export-eyebrow">Build &amp; Export</div>
              <h2 className="sets-export-title">
                <span className="sets-export-title-line">From individual icons</span>
                <span className="sets-export-title-line">to a complete set.</span>
              </h2>
              <p className="sets-export-subtext">
                Organize your icons, keep everything together, and export clean SVGs when your set is ready.
              </p>

              <div className="sets-export-pills">
                <span className="sets-export-pill">
                  <span className="sets-export-pill-dot" />
                  Organize into sets
                </span>
                <span className="sets-export-pill">
                  <span className="sets-export-pill-dot" />
                  Keep specs consistent
                </span>
                <span className="sets-export-pill">
                  <span className="sets-export-pill-dot" />
                  Export clean SVG &amp; ZIP
                </span>
              </div>

              <div className="section-cta-wrap">
                <Link href="/create" className="btn btn-primary section-cta-btn">
                  <span>Create an icon</span> <ArrowRight size={15} className="cta-arrow" />
                </Link>
              </div>
            </div>

            <div className="sets-export-visual">
              <div className="sets-export-card" aria-label="Icon set overview and export workspace">
                <div className="sets-export-card-header">
                  <div className="sets-export-header-main">
                    <div className="sets-export-header-title-row">
                      <FolderKanban size={14} className="sets-export-folder-icon" />
                      <span className="sets-export-set-name">Interface Icons</span>
                      <span className="sets-export-count-badge">6 icons</span>
                      <span className="sets-export-status-badge">
                        <span className="sets-export-status-dot" />
                        Consistent
                      </span>
                    </div>
                    <p className="sets-export-set-desc">Core navigation &amp; interface icon set</p>
                  </div>

                  <div className="sets-export-meta-chips">
                    <span className="sets-export-chip">24 × 24</span>
                    <span className="sets-export-chip">1.5 px</span>
                    <span className="sets-export-chip">Outline</span>
                  </div>
                </div>

                <div className="sets-export-card-body">
                  <div className="sets-export-grid-meta">
                    <span className="sets-export-grid-label">Set members</span>
                    <span className="sets-export-grid-spec">Uniform 1.5 px · 24 × 24 grid</span>
                  </div>

                  <div className="sets-export-tiles">
                    {SET_OVERVIEW_ICONS.map((item) => (
                      <div key={item.id} className="sets-export-tile">
                        <div className="sets-export-tile-artboard">
                          <span
                            className="sets-export-tile-svg"
                            dangerouslySetInnerHTML={{
                              __html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${iconPaths[item.id]}</svg>`,
                            }}
                          />
                        </div>
                        <div className="sets-export-tile-info">
                          <span className="sets-export-tile-name">{item.name}</span>
                          <span className="sets-export-tile-ext">.svg</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sets-export-bar">
                  <div className="sets-export-format-group">
                    <span className="sets-export-format-caption">Format:</span>
                    <div className="sets-export-formats">
                      <button
                        type="button"
                        className={`sets-export-format-btn ${exportFormat === "svg" ? "active" : ""}`}
                        onClick={() => setExportFormat("svg")}
                        aria-label="Select SVG export format"
                      >
                        SVG
                      </button>
                      <button
                        type="button"
                        className={`sets-export-format-btn ${exportFormat === "zip" ? "active" : ""}`}
                        onClick={() => setExportFormat("zip")}
                        aria-label="Select ZIP export format"
                      >
                        ZIP
                      </button>
                    </div>
                    <span className="sets-export-format-hint">
                      {exportFormat === "svg" ? "Clean vector markup" : "Full archive package"}
                    </span>
                  </div>

                  <div className="sets-export-action-group">
                    <button
                      type="button"
                      className={`sets-export-btn ${exportSuccess ? "exported" : ""}`}
                      onClick={handleExportClick}
                      aria-label={exportFormat === "svg" ? "Export SVG set" : "Export ZIP archive"}
                    >
                      {exportSuccess ? (
                        <>
                          <Check size={13} strokeWidth={2.5} />
                          <span>{exportFormat === "svg" ? "6 SVGs ready" : "Archive ready"}</span>
                        </>
                      ) : (
                        <>
                          <Download size={13} />
                          <span>{exportFormat === "svg" ? "Export SVG" : "Export ZIP"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="landing-footer-inner">
            <nav className="landing-footer-nav" aria-label="Footer navigation">
              <div className="landing-footer-group">
                <Link href="/create" className="landing-footer-link">
                  Create an icon
                </Link>

                <span className="landing-footer-dot" aria-hidden="true">·</span>

                <Link href="/sets" className="landing-footer-link">
                  Icon sets
                </Link>
              </div>

              <span className="landing-footer-dot desktop-only" aria-hidden="true">·</span>

              <div className="landing-footer-group">
                <span className="landing-footer-credit">
                  <span className="footer-sparkle" aria-hidden="true">✦</span>
                  {" Made with "}
                  <span className="footer-heart" aria-label="love">❤️</span>
                  {" by "}
                  <span
                    className={`pushkar-trigger ${pushkarPhotoOpen ? "is-open" : ""}`}
                    tabIndex={0}
                    role="button"
                    aria-haspopup="dialog"
                    aria-expanded={pushkarPhotoOpen}
                    aria-label="Pushkar Verma - creator profile"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPushkarPhotoOpen((prev) => !prev);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setPushkarPhotoOpen((prev) => !prev);
                      }
                    }}
                  >
                    <strong className="pushkar-name">Pushkar</strong>
                    <span className="pushkar-popup" role="tooltip" aria-hidden={!pushkarPhotoOpen}>
                      <span className="pushkar-avatar-wrap">
                        <Image
                          src="/pushkar.png"
                          alt="Pushkar Verma"
                          width={76}
                          height={76}
                          className="pushkar-avatar-img"
                          priority
                        />
                      </span>
                      <span className="pushkar-popup-label">Pushkar Verma</span>
                    </span>
                  </span>
                  {" "}
                  <span className="footer-sparkle" aria-hidden="true">✦</span>
                </span>

                <span className="landing-footer-copy">© 2026 IconForge</span>
              </div>
            </nav>
          </div>
        </footer>
      </div>
    </main>
  );
}

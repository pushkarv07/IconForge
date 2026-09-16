"use client";

import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useState } from "react";
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

export default function Home() {
  const [chosen, setChosen] = useState<IconName>("cloud-upload");
  const [activePromptId, setActivePromptId] = useState("cloud-upload");
  const [selectedVariationIdx, setSelectedVariationIdx] = useState(0);

  const currentItem = HERO_SET.find((item) => item.id === chosen) ?? HERO_SET[0];
  const activePromptSample =
    PROMPT_SAMPLES.find((s) => s.id === activePromptId) ?? PROMPT_SAMPLES[0];

  return (
    <main className="app-shell landing">
      <div className="hero">
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
              Open workspace <ArrowRight size={15} />
            </Link>
          </div>
        </nav>

        <section className="hero-grid">
          <div className="hero-content">
            <div className="eyebrow hero-eyebrow">The Consistent Icon Generator</div>
            <h1 className="hero-title">Build icons that belong together.</h1>
            <p className="hero-copy">
              AI-powered icon generation with consistent style across your entire icon set.
            </p>

            <div className="hero-actions">
              <Link href="/create" className="btn btn-primary hero-btn-primary">
                Create an icon <ArrowRight size={15} />
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
                  <div
                    className="showcase-active-icon"
                    dangerouslySetInnerHTML={{
                      __html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${iconPaths[chosen]}</svg>`,
                    }}
                  />
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
        <section className="section-rule">
          <div>
            <div className="eyebrow">One visual language</div>
            <h2 style={{ margin: "10px 0", fontSize: 27, letterSpacing: "-.04em", fontWeight: 600 }}>
              A set that feels authored.
            </h2>
            <p className="muted" style={{ maxWidth: 390, lineHeight: 1.55, fontSize: 14 }}>
              Lock the character of one icon, then carry its weight, rhythm, and geometry through everything that follows.
            </p>
          </div>
          <div className="set-preview">
            <span className="muted" style={{ fontSize: 12 }}>Finance Icons</span>
            {["wallet", "card", "chart", "bank", "receipt"].map((name) => (
              <span
                key={name}
                dangerouslySetInnerHTML={{
                  __html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name as keyof typeof iconPaths]}</svg>`,
                }}
              />
            ))}
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
                        <span className="workflow-variations-eyebrow">Generated variations</span>
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
      </div>
    </main>
  );
}

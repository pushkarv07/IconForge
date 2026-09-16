"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
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

export default function Home() {
  const [chosen, setChosen] = useState<IconName>("cloud-upload");
  const currentItem = HERO_SET.find((item) => item.id === chosen) ?? HERO_SET[0];

  return (
    <main className="app-shell">
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
            <div className="eyebrow">The Consistent Icon Generator</div>
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
      </div>
    </main>
  );
}

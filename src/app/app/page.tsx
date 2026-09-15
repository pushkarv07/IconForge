"use client";

import Link from "next/link";
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  Grid3X3,
  Loader2,
  LockKeyhole,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  RotateCcw,
  Sparkles,
  Unlock,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { mockGenerator, styleFromIcon } from "@/lib/generator";
import { loadSets, makeSet, saveSets } from "@/lib/sets";
import type {
  CanvasSize,
  Complexity,
  IconCandidate,
  IconSet,
  IconStyle,
  PreviewBackground,
  StyleProfile,
  StyleReference,
} from "@/lib/types";

type GenerationMode = "ai" | "mock";
const initialRequest = {
  prompt: "calendar with notification badge",
  style: "Outline" as IconStyle,
  canvas: 24 as CanvasSize,
  stroke: 1.5 as 1 | 1.5 | 2,
  complexity: "Simple" as Complexity,
  color: "Current Color" as "Current Color" | "Black" | "Custom",
};

const renderSvg = (svg: string) => ({
  __html: svg.replace("<svg ", '<svg aria-hidden="true" '),
});

export default function GeneratorPage() {
  const [request, setRequest] = useState(initialRequest);
  const requestRef = useRef(initialRequest);
  const [candidates, setCandidates] = useState<IconCandidate[]>(() =>
    mockGenerator.generateIcons(initialRequest)
  );
  const [selectedId, setSelectedId] = useState(candidates[0].id);
  const [locked, setLocked] = useState<StyleProfile | null>(null);
  const [lockedReference, setLockedReference] = useState<StyleReference | null>(
    null
  );
  const [zoom, setZoom] = useState(1);
  const [grid, setGrid] = useState(false);
  const [background, setBackground] = useState<PreviewBackground>("light");
  const [status, setStatus] = useState("");
  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState<GenerationMode>("ai");
  const [generationError, setGenerationError] = useState("");
  const [retryUsed, setRetryUsed] = useState(false);
  const [sets, setSets] = useState<IconSet[]>([]);
  const [setDialogOpen, setSetDialogOpen] = useState(false);
  const [newSetName, setNewSetName] = useState("");
  const [newSetDescription, setNewSetDescription] = useState("");
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const selected =
    candidates.find((candidate) => candidate.id === selectedId) ??
    candidates[0];
  useEffect(() => setSets(loadSets()), []);

  function flash(message: string) {
    setStatus(message);
    window.setTimeout(() => setStatus(""), 2200);
  }

  function mockResult() {
    const next = mockGenerator
      .generateIcons({ ...requestRef.current, lockedStyle: locked })
      .map((candidate) => ({ ...candidate, label: "Mock result" }));
    setMode("mock");
    setCandidates(next);
    setSelectedId(next[0].id);
    setGenerationError("");
    setRetryUsed(false);
    flash("Mock mode: local SVG generated");
  }

  function lockSelectedStyle() {
    setLocked(styleFromIcon(selected, request));
    setLockedReference({
      pathCount: selected.pathCount,
      viewBox: "0 0 24 24",
      svg: selected.svg,
    });
    flash("Style locked");
  }

  function unlockStyle() {
    setLocked(null);
    setLockedReference(null);
    flash("Style unlocked");
  }

  function renameStyle() {
    if (!locked) return;
    const name = window.prompt("Rename style", locked.name);
    if (name?.trim()) setLocked({ ...locked, name: name.trim() });
  }

  function duplicateStyle() {
    if (!locked) return;
    setLocked({ ...locked, name: `${locked.name} copy` });
    flash("Style duplicated");
  }

  function updateValue(key: keyof typeof request, value: string | number) {
    const next = { ...requestRef.current, [key]: value } as typeof request;
    requestRef.current = next;
    setRequest(next);
    if (locked && ["style", "canvas", "stroke", "complexity"].includes(key)) {
      const updated = styleFromIcon(
        {
          ...selected,
          canvas: next.canvas,
          stroke: next.stroke,
          style: next.style,
          complexity: next.complexity,
        },
        next
      );
      setLocked({
        ...locked,
        canvas: updated.canvas,
        stroke: updated.stroke,
        strokeWidth: updated.strokeWidth,
        fillMode: updated.fillMode,
        complexity: updated.complexity,
      });
      flash("Locked style updated");
    }
  }

  async function generate(isRetry = false) {
    if (generating) return;
    if (isRetry && retryUsed) return;
    setGenerationError("");
    setGenerating(true);
    if (isRetry) setRetryUsed(true);
    else setRetryUsed(false);
    flash(
      mode === "ai"
        ? "Asking Gemini for six variations..."
        : "Generating six variations locally..."
    );
    if (mode === "mock") {
      window.setTimeout(() => {
        mockResult();
        setGenerating(false);
      }, 450);
      return;
    }
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...requestRef.current,
          lockedStyle: locked,
          styleReference: lockedReference,
        }),
      });
      const result = (await response.json()) as {
        candidates?: IconCandidate[];
        error?: string;
        code?: "quota" | "upstream";
      };
      if (!response.ok || !result.candidates?.length) {
        if (response.status === 429 || result.code === "quota")
          throw new Error("Gemini quota or rate limit reached.");
        throw new Error(result.error ?? "Gemini is temporarily unavailable.");
      }
      setCandidates(result.candidates);
      setSelectedId(result.candidates[0].id);
      setRetryUsed(false);
      flash("Six AI variations generated");
    } catch (error) {
      const message =
        error instanceof TypeError && error.message === "Failed to fetch"
          ? "The AI server is unavailable. Try again or use Mock result."
          : error instanceof Error
          ? error.message
          : "AI generation unavailable.";
      setGenerationError(message);
      flash("Gemini generation failed");
    } finally {
      setGenerating(false);
    }
  }

  function copySvg() {
    navigator.clipboard?.writeText(selected.svg);
    flash("SVG copied to clipboard");
  }

  function downloadSvg() {
    const url = URL.createObjectURL(
      new Blob([selected.svg], { type: "image/svg+xml" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selected.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-icon.svg`;
    link.click();
    URL.revokeObjectURL(url);
    flash("SVG download started");
  }

  function addToSet() {
    setSetDialogOpen(true);
  }

  function addToExistingSet(setId: string) {
    const nextSets = sets.map((set) =>
      set.id === setId
        ? {
            ...set,
            icons: set.icons.some((icon) => icon.id === selected.id)
              ? set.icons
              : [...set.icons, selected],
            profile: set.icons.length
              ? set.profile
              : locked ?? styleFromIcon(selected, request),
            updatedAt: new Date().toISOString(),
          }
        : set
    );
    setSets(nextSets);
    saveSets(nextSets);
    setSetDialogOpen(false);
    flash(
      `Added ${selected.name} to ${
        sets.find((set) => set.id === setId)?.name ?? "set"
      }`
    );
  }

  function createSetAndAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!newSetName.trim()) return;
    const created = makeSet(
      newSetName.trim(),
      newSetDescription.trim(),
      locked ?? styleFromIcon(selected, request)
    );
    created.icons = [selected];
    const nextSets = [...sets, created];
    setSets(nextSets);
    saveSets(nextSets);
    setNewSetName("");
    setNewSetDescription("");
    setSetDialogOpen(false);
    flash(`Added ${selected.name} to ${created.name}`);
  }

  const basePreviewPx = 216;
  const previewSize = Math.round(basePreviewPx * zoom);

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark">IF</span> IconForge
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ThemeSwitcher />
          <Link href="/sets" className="btn btn-quiet">
            Sets {sets.length ? `(${sets.length})` : ""}
          </Link>
        </div>
      </header>

      <div
        className={`workspace ${!leftPanelOpen ? "left-collapsed" : ""} ${
          !rightPanelOpen ? "right-collapsed" : ""
        }`}
      >
        <aside className={`panel ${!leftPanelOpen ? "collapsed" : ""}`}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <h1 className="property-title">Create icon</h1>
            <span
              className={`mode-badge ${
                mode === "ai" ? "mode-badge-ai" : "mode-badge-mock"
              }`}
            >
              {mode === "ai" ? (
                <>
                  <Sparkles
                    size={11}
                    style={{ marginRight: 4, verticalAlign: "-1px" }}
                  />{" "}
                  AI MODE
                </>
              ) : (
                "MOCK FALLBACK"
              )}
            </span>
          </div>

          <div className="control-stack">
            {locked && (
              <div className="lock-banner">
                <span>
                  <LockKeyhole
                    size={13}
                    style={{ verticalAlign: "-2px", marginRight: 5 }}
                  />{" "}
                  <strong>Style locked</strong>
                  <small className="lock-help">
                    New icons will follow this visual language.
                  </small>
                </span>
                <button
                  className="icon-btn"
                  onClick={unlockStyle}
                  aria-label="Unlock style"
                >
                  <Unlock size={14} />
                </button>
              </div>
            )}

            <div>
              <span className="field-label">Generation mode</span>
              <div className="segmented mode-segmented">
                <button
                  type="button"
                  aria-pressed={mode === "ai"}
                  onClick={() => setMode("ai")}
                  className={mode === "ai" ? "mode-active-ai" : ""}
                >
                  <Sparkles
                    size={13}
                    style={{
                      display: "inline",
                      verticalAlign: "-1px",
                      marginRight: 4,
                    }}
                  />
                  AI (Gemini)
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "mock"}
                  onClick={() => setMode("mock")}
                  className={mode === "mock" ? "mode-active-mock" : ""}
                >
                  Mock (Fallback)
                </button>
              </div>
              <p className="mode-caption">
                {mode === "ai" ? (
                  <>
                    <strong>Primary AI:</strong> Generates unique vector concepts
                    with Gemini.
                  </>
                ) : (
                  <>
                    <strong>Local Fallback:</strong> Offline template generator.
                    Instant results.
                  </>
                )}
              </p>
            </div>

            <div className="prompt-field-group">
              <label className="field-label" htmlFor="prompt">
                Description
              </label>
              <textarea
                id="prompt"
                className="prompt-textarea"
                placeholder="Describe the icon you want to forge..."
                value={request.prompt}
                onChange={(event) => updateValue("prompt", event.target.value)}
                rows={3}
              />
              <div className="prompt-helper">
                <span className="muted">Try</span>
                <button
                  type="button"
                  className="prompt-chip-btn"
                  onClick={() =>
                    updateValue("prompt", "coffee cup with steam")
                  }
                  title="Click to use this prompt"
                >
                  &ldquo;coffee cup with steam&rdquo;
                </button>
              </div>
            </div>

            <div>
              <span className="field-label">Style</span>
              <div className="segmented">
                {(["Outline", "Solid", "Duotone"] as IconStyle[]).map(
                  (value) => (
                    <button
                      key={value}
                      aria-pressed={request.style === value}
                      onClick={() => updateValue("style", value)}
                    >
                      {value}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="canvas">
                Canvas
              </label>
              <select
                id="canvas"
                className="select"
                value={request.canvas}
                onChange={(event) =>
                  updateValue("canvas", Number(event.target.value))
                }
              >
                {[16, 20, 24, 32].map((value) => (
                  <option key={value} value={value}>
                    {value} × {value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label" htmlFor="stroke">
                Stroke
              </label>
              <select
                id="stroke"
                className="select"
                value={request.stroke}
                onChange={(event) =>
                  updateValue("stroke", Number(event.target.value))
                }
              >
                {[1, 1.5, 2].map((value) => (
                  <option key={value} value={value}>
                    {value} px
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="field-label">Complexity</span>
              <div className="segmented">
                {(["Simple", "Balanced", "Detailed"] as Complexity[]).map(
                  (value) => (
                    <button
                      key={value}
                      aria-pressed={request.complexity === value}
                      onClick={() => updateValue("complexity", value)}
                    >
                      {value}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="color">
                Color
              </label>
              <select
                id="color"
                className="select"
                value={request.color}
                onChange={(event) => updateValue("color", event.target.value)}
              >
                <option>Current Color</option>
                <option>Black</option>
                <option>Custom</option>
              </select>
            </div>

            <div className="generate-action-bar">
              <button
                className="btn-generate-main"
                onClick={() => generate()}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2
                      size={16}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    <span>Generating variations…</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>
                      Generate{" "}
                      {mode === "ai" ? "AI Variations" : "Mock Variations"}
                    </span>
                  </>
                )}
              </button>
            </div>

            {generationError && (
              <div className="lock-banner generation-error" role="alert">
                <span>
                  <strong>AI generation unavailable</strong>
                  <small>{generationError}</small>
                </span>
                <span className="generation-actions">
                  <button
                    className="btn"
                    onClick={() => generate(true)}
                    disabled={retryUsed}
                    aria-label="Retry"
                  >
                    Retry
                  </button>
                  <button
                    className="btn"
                    onClick={mockResult}
                    aria-label="Use Mock Mode"
                  >
                    Use Mock Mode
                  </button>
                </span>
              </div>
            )}
          </div>
        </aside>

        <section className="canvas">
          <div className="preview-toolbar">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                className={`icon-btn ${leftPanelOpen ? "active" : ""}`}
                onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                aria-label={
                  leftPanelOpen ? "Collapse controls" : "Expand controls"
                }
                title={
                  leftPanelOpen ? "Collapse controls" : "Expand controls"
                }
              >
                {leftPanelOpen ? (
                  <PanelLeftClose size={16} />
                ) : (
                  <PanelLeftOpen size={16} />
                )}
              </button>
              <div>
                <span className="eyebrow">Preview</span>
                <div className="kicker" style={{ marginTop: 2 }}>
                  {selected.name} · {selected.canvas} × {selected.canvas}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                className="icon-btn"
                onClick={() =>
                  setZoom((value) => Math.min(1.8, Number((value + 0.15).toFixed(2))))
                }
                aria-label="Zoom in"
                title="Zoom in"
              >
                <ZoomIn size={16} />
              </button>
              <button
                className="icon-btn"
                onClick={() =>
                  setZoom((value) => Math.max(0.5, Number((value - 0.15).toFixed(2))))
                }
                aria-label="Zoom out preview"
                title="Zoom out preview"
              >
                <ZoomOut size={16} />
              </button>
              <span
                className="zoom-indicator"
                title="Preview display scale (SVG export viewBox remains standard)"
              >
                {Math.round(zoom * 100)}%
              </span>
              <button
                className="icon-btn"
                onClick={() => setZoom(1)}
                aria-label="Reset zoom"
                title="Reset preview zoom to 100%"
              >
                <RotateCcw size={15} />
              </button>
              <button
                className={`icon-btn ${grid ? "active selected" : ""}`}
                onClick={() => setGrid(!grid)}
                aria-label="Toggle grid"
                title="Toggle editor grid"
              >
                <Grid3X3 size={15} />
              </button>
              <select
                className="select"
                style={{ width: 110, height: 34 }}
                aria-label="Preview background"
                value={background}
                onChange={(event) =>
                  setBackground(event.target.value as PreviewBackground)
                }
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="checkerboard">Checker</option>
              </select>
              <button
                className={`icon-btn ${rightPanelOpen ? "active" : ""}`}
                onClick={() => setRightPanelOpen(!rightPanelOpen)}
                aria-label={
                  rightPanelOpen ? "Collapse properties" : "Expand properties"
                }
                title={
                  rightPanelOpen ? "Collapse properties" : "Expand properties"
                }
              >
                {rightPanelOpen ? (
                  <PanelRightClose size={16} />
                ) : (
                  <PanelRightOpen size={16} />
                )}
              </button>
            </div>
          </div>

          {generating && (
            <div className="generation-status-banner">
              <Loader2
                size={14}
                style={{ animation: "spin 1s linear infinite" }}
              />
              <span>
                {mode === "ai"
                  ? "Generating icon variations with Gemini…"
                  : "Generating icon variations locally…"}
              </span>
            </div>
          )}

          <div className={`preview-box preview-${background}`}>
            <div className="artboard-container">
              <div
                className="artboard-stage"
                style={{
                  width: `${previewSize + 48}px`,
                  height: `${previewSize + 48}px`,
                }}
              >
                {grid && <div className="artboard-grid-overlay" />}
                {grid && (
                  <>
                    <div className="artboard-crosshair-h" />
                    <div className="artboard-crosshair-v" />
                  </>
                )}
                <div
                  className="preview-icon"
                  style={{
                    width: `${previewSize}px`,
                    height: `${previewSize}px`,
                  }}
                  dangerouslySetInnerHTML={renderSvg(selected.svg)}
                />
              </div>
              <div className="artboard-meta">
                <span>viewBox {selected.canvas} × {selected.canvas}</span>
                <span>•</span>
                <span title="Display zoom scale only; exported SVG dimensions are unchanged">
                  Preview {Math.round(zoom * 100)}%
                </span>
                <span>•</span>
                <span>{selected.stroke}px stroke</span>
              </div>
            </div>
          </div>

          <div className="variations">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span className="eyebrow">Generated variations</span>
                <div className="kicker" style={{ marginTop: 4 }}>
                  Select a direction to inspect & export
                </div>
              </div>
              <span className="kicker">{candidates.length} candidates</span>
            </div>

            <div
              className={`variation-grid ${
                generating ? "generating-pulse" : ""
              }`}
            >
              {candidates.map((candidate, idx) => {
                const isSelected = selected.id === candidate.id;
                const isBestMatch = candidate.label
                  .toLowerCase()
                  .includes("best match");
                const isMock = candidate.label.toLowerCase().includes("mock");
                return (
                  <button
                    key={candidate.id}
                    className={`variation variation-revealing ${
                      isSelected ? "selected" : ""
                    }`}
                    onClick={() => setSelectedId(candidate.id)}
                    aria-label={`Select ${candidate.name} (${candidate.label})`}
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    {isSelected && (
                      <div
                        className="variation-check"
                        title="Currently selected"
                      >
                        <Check size={11} strokeWidth={3} />
                      </div>
                    )}
                    <span
                      className={`variation-badge ${
                        isBestMatch
                          ? "best-match"
                          : isMock
                          ? "mock-badge"
                          : ""
                      }`}
                    >
                      {isBestMatch
                        ? "Best match"
                        : isMock
                        ? "Mock result"
                        : `Var ${idx + 1}`}
                    </span>
                    <div
                      className="variation-icon-wrap"
                      dangerouslySetInnerHTML={renderSvg(candidate.svg)}
                    />
                    <div className="variation-info">
                      <div className="variation-name">{candidate.name}</div>
                      <div className="variation-meta">
                        {candidate.canvas}px · {candidate.stroke}px ·{" "}
                        {candidate.pathCount}p
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <aside
          className={`panel properties ${
            !rightPanelOpen ? "collapsed" : ""
          }`}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h2 className="property-title">Icon</h2>
              <button className="icon-btn" aria-label="More icon options">
                <ChevronDown size={16} />
              </button>
            </div>
            <div className="icon-summary">
              <span dangerouslySetInnerHTML={renderSvg(selected.svg)} />
              <div>
                <strong style={{ fontSize: 14 }}>{selected.name}</strong>
                <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                  {selected.label}
                </div>
              </div>
            </div>
            <div className="stat-list" style={{ marginTop: 18 }}>
              <div className="stat-row">
                <span>Size</span>
                <strong>
                  {selected.canvas} × {selected.canvas}
                </strong>
              </div>
              <div className="stat-row">
                <span>Stroke</span>
                <strong>{selected.stroke} px</strong>
              </div>
              <div className="stat-row">
                <span>Fill</span>
                <strong>{selected.style}</strong>
              </div>
              <div className="stat-row">
                <span>Path count</span>
                <strong>{selected.pathCount}</strong>
              </div>
            </div>
          </div>

          <div className="actions">
            <button
              className={`btn ${locked ? "btn-primary" : ""}`}
              onClick={locked ? unlockStyle : lockSelectedStyle}
            >
              {locked ? (
                <>
                  <LockKeyhole size={14} /> Style locked
                </>
              ) : (
                <>
                  <LockKeyhole size={14} /> Lock style
                </>
              )}
            </button>
            <button className="btn" onClick={copySvg}>
              <Copy size={14} /> Copy SVG
            </button>
            <button className="btn" onClick={downloadSvg}>
              <Download size={14} /> Download SVG
            </button>
            <button className="btn" onClick={addToSet}>
              <Plus size={14} /> Add to set
            </button>
          </div>

          {locked && (
            <details className="style-profile" open>
              <summary>Style profile</summary>
              <div className="style-profile-grid">
                <span>Canvas</span>
                <strong>
                  {locked.canvas} × {locked.canvas}
                </strong>
                <span>Stroke</span>
                <strong>{locked.strokeWidth} px</strong>
                <span>Cap</span>
                <strong>{locked.strokeLinecap}</strong>
                <span>Join</span>
                <strong>{locked.strokeLinejoin}</strong>
                <span>Fill</span>
                <strong>{locked.fillMode}</strong>
                <span>Complexity</span>
                <strong>{locked.complexity}</strong>
              </div>
              <div className="style-profile-actions">
                <button className="btn" onClick={renameStyle}>
                  Rename style
                </button>
                <button className="btn" onClick={duplicateStyle}>
                  Duplicate style
                </button>
              </div>
            </details>
          )}

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div className="kicker">SVG markup</div>
              <span className="muted" style={{ fontSize: 10 }}>
                {selected.svg.length} chars
              </span>
            </div>
            <pre className="code-viewer">{selected.svg}</pre>
          </div>
        </aside>
      </div>

      {setDialogOpen && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-set-title"
          >
            <div className="eyebrow">Library</div>
            <h2 id="add-set-title" className="property-title">
              Add to set
            </h2>
            {sets.length ? (
              <div className="set-choice-list">
                {sets.map((set) => (
                  <button
                    className="set-choice"
                    key={set.id}
                    onClick={() => addToExistingSet(set.id)}
                  >
                    <span>
                      <strong>{set.name}</strong>
                      <small>
                        {set.icons.length} icons · {set.profile.canvas} ×{" "}
                        {set.profile.canvas}
                      </small>
                    </span>
                    <Plus size={15} />
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted">No sets yet. Create one for this icon.</p>
            )}
            <form onSubmit={createSetAndAdd}>
              <label className="field-label" htmlFor="new-set-name">
                Create new set
              </label>
              <input
                id="new-set-name"
                className="textarea"
                value={newSetName}
                onChange={(event) => setNewSetName(event.target.value)}
                placeholder="Set name"
              />
              <textarea
                className="textarea"
                value={newSetDescription}
                onChange={(event) => setNewSetDescription(event.target.value)}
                placeholder="Description (optional)"
              />
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setSetDialogOpen(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  <Plus size={14} /> Create new set
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {status && (
        <div className="toast" role="status">
          <Check
            size={14}
            style={{ verticalAlign: "-2px", marginRight: 6 }}
          />
          {status}
        </div>
      )}
    </main>
  );
}

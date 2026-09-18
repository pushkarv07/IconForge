"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Download,
  Layers,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { use, useEffect, useState } from "react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { consistencyScore, type ConsistencyFinding } from "@/lib/consistency";
import { downloadAllIconsAsZip } from "@/lib/export";
import { defaultStyleProfile, loadSets, saveSets } from "@/lib/sets";
import type { IconCandidate, IconSet } from "@/lib/types";

function fileName(name: string) { return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "icon"; }
function profileFor(set: IconSet) { return { ...defaultStyleProfile, ...set.profile }; }
function downloadSvg(icon: IconCandidate) { const url = URL.createObjectURL(new Blob([icon.svg], { type: "image/svg+xml" })); const link = document.createElement("a"); link.href = url; link.download = `${fileName(icon.name)}.svg`; link.click(); URL.revokeObjectURL(url); }

export default function SetDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [set, setSet] = useState<IconSet | null>(null);
  const [result, setResult] = useState<ReturnType<typeof consistencyScore> | null>(null);
  const [checking, setChecking] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    window.setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 2800);
  }

  async function handleDownloadAll() {
    if (exporting) return;
    setExporting(true);
    try {
      const count = await downloadAllIconsAsZip(currentSet);
      showToast(`${count} ${count === 1 ? "SVG" : "SVGs"} exported`, "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export SVGs";
      showToast(message, "error");
    } finally {
      setExporting(false);
    }
  }

  async function handleExportSet() {
    if (exporting) return;
    setExporting(true);
    try {
      const count = await downloadAllIconsAsZip(currentSet);
      showToast(`${count} ${count === 1 ? "SVG" : "SVGs"} exported`, "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export icon set";
      showToast(message, "error");
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => { setSet(loadSets().find((item) => item.id === id) ?? null); }, [id]);
  if (!set) return <main className="app-shell"><div className="page-content"><p className="muted">Set not found.</p><Link href="/sets" className="btn">Back to sets</Link></div></main>;
  const currentSet = set;
  const profile = profileFor(currentSet);
  function persist(next: IconSet) { const updated = { ...next, updatedAt: new Date().toISOString() }; setSet(updated); saveSets(loadSets().map((item) => item.id === updated.id ? updated : item)); setResult(null); }
  function runConsistency() {
    if (checking) return;
    setChecking(true); setAnalysisError("");
    window.setTimeout(() => { try { setResult(consistencyScore(currentSet.icons, profile)); } catch { setResult(null); setAnalysisError("Consistency analysis could not be completed."); } finally { setChecking(false); } }, 120);
  }
  function renameSet() { const name = window.prompt("Rename icon set", currentSet.name); if (name?.trim()) persist({ ...currentSet, name: name.trim() }); }
  function renameIcon(icon: IconCandidate) { const name = window.prompt("Rename icon", icon.name); if (name?.trim()) persist({ ...currentSet, icons: currentSet.icons.map((item) => item.id === icon.id ? { ...item, name: name.trim() } : item) }); }
  function removeIcon(icon: IconCandidate) { persist({ ...currentSet, icons: currentSet.icons.filter((item) => item.id !== icon.id) }); }
  function move(index: number, direction: -1 | 1) { const target = index + direction; if (target < 0 || target >= currentSet.icons.length) return; const icons = [...currentSet.icons]; [icons[index], icons[target]] = [icons[target], icons[index]]; persist({ ...currentSet, icons }); }
  async function regenerate(icon: IconCandidate) {
    if (!window.confirm(`Generate a replacement for ${icon.name} using Forge Style?`)) return;
    setBusy(icon.id);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: icon.name,
          style: profile.fillMode,
          canvas: profile.canvas,
          stroke: profile.stroke,
          complexity: profile.complexity,
          color: "Current Color",
          lockedStyle: profile,
          styleReference: {
            pathCount: icon.pathCount,
            viewBox: `0 0 ${profile.canvas} ${profile.canvas}`,
            svg: icon.svg,
          },
        }),
      });
      const data = (await response.json()) as { candidates?: IconCandidate[]; error?: string };
      if (!response.ok || !data.candidates?.[0]) throw new Error(data.error ?? "Could not regenerate icon");
      const updatedCandidate = { ...data.candidates[0], name: icon.name };
      const updatedIcons = currentSet.icons.map((item) => (item.id === icon.id ? updatedCandidate : item));
      const updated = { ...currentSet, icons: updatedIcons, updatedAt: new Date().toISOString() };
      setSet(updated);
      saveSets(loadSets().map((item) => (item.id === updated.id ? updated : item)));
      setResult(consistencyScore(updatedIcons, profile));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not regenerate icon");
    } finally {
      setBusy(null);
    }
  }
  const findings = result?.findings ?? [];
  return (
    <main className="app-shell">
      <header className="topbar">
        <Link href="/sets" className="brand">
          <ArrowLeft size={16} /> Icon sets
        </Link>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <ThemeSwitcher />
          <Link href="/create" className="btn btn-primary">
            <Plus size={14} /> Create icon
          </Link>
        </div>
      </header>

      <div className="page-content">
        <div className="page-header detail-header">
          <div className="detail-header-main">
            <div className="detail-header-eyebrow">
              <span className="eyebrow eyebrow-neutral">Icon set</span>
              <span className="detail-badge">
                {set.icons.length} {set.icons.length === 1 ? "icon" : "icons"}
              </span>
            </div>
            <h1 className="detail-title">{set.name}</h1>
            {set.description && (
              <p className="detail-description">{set.description}</p>
            )}
            <div className="detail-meta-strip">
              <span className="meta-pill">{profile.canvas} × {profile.canvas}</span>
              <span className="meta-pill">{profile.stroke} px</span>
              <span className="meta-pill">{profile.fillMode}</span>
              <span className="meta-pill">{profile.cap} cap</span>
              <span className="meta-pill">{profile.join} join</span>
              <span className="meta-pill">{profile.complexity}</span>
            </div>
          </div>

          <div className="detail-header-actions">
            <button className="btn" onClick={renameSet}>
              <Pencil size={13.5} /> Rename
            </button>
            <button className="btn" onClick={handleExportSet} disabled={exporting}>
              <Download size={13.5} /> Export set
            </button>
            <button
              className={`btn ${result?.score === 100 ? "btn-success-state" : ""}`}
              onClick={runConsistency}
              disabled={checking}
            >
              {checking ? (
                "Checking..."
              ) : (
                <>
                  <Check size={14} /> {result?.score === 100 ? "Consistent" : "Check consistency"}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="set-detail-layout">
          <section className="icon-grid-section">
            {set.icons.length ? (
              <div className="icon-grid">
                {set.icons.map((icon, index) => {
                  const finding = findings.find((item) => item.iconId === icon.id);
                  const isMismatch = Boolean(finding?.mismatch);
                  const isRegenerating = busy === icon.id;

                  return (
                    <article
                      className={`icon-card ${isMismatch ? "icon-card-mismatch" : ""}`}
                      key={icon.id}
                    >
                      <div className="icon-card-preview-stage">
                        <div
                          className="icon-card-svg"
                          dangerouslySetInnerHTML={{ __html: icon.svg }}
                        />
                        {isMismatch && (
                          <div className="mismatch-badge">
                            <AlertTriangle size={11} /> Mismatch
                          </div>
                        )}
                      </div>

                      <div className="icon-card-info">
                        <div className="icon-card-name" title={icon.name}>
                          {icon.name}
                        </div>
                        <div className="icon-card-meta">
                          <span>{icon.canvas} × {icon.canvas}</span>
                          <span className="spec-dot">·</span>
                          <span>{icon.stroke}px</span>
                          <span className="spec-dot">·</span>
                          <span>{icon.style}</span>
                        </div>
                        {isMismatch && finding?.reasons && finding.reasons.length > 0 && (
                          <div className="mismatch-reasons" title={finding.reasons.join(", ")}>
                            {finding.reasons.join(" · ")}
                          </div>
                        )}
                      </div>

                      <div className="icon-card-bottom">
                        <div className="icon-card-order-actions">
                          <button
                            className="icon-btn"
                            onClick={() => move(index, -1)}
                            disabled={index === 0}
                            aria-label={`Move ${icon.name} up`}
                            title="Move earlier"
                          >
                            <ArrowUp size={12.5} />
                          </button>
                          <button
                            className="icon-btn"
                            onClick={() => move(index, 1)}
                            disabled={index === set.icons.length - 1}
                            aria-label={`Move ${icon.name} down`}
                            title="Move later"
                          >
                            <ArrowDown size={12.5} />
                          </button>
                        </div>

                        <div className="icon-card-tools">
                          <button
                            className="icon-btn"
                            onClick={() => renameIcon(icon)}
                            aria-label={`Rename ${icon.name}`}
                            title="Rename icon"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            className="icon-btn"
                            onClick={() => downloadSvg(icon)}
                            aria-label={`Download ${icon.name}`}
                            title="Download SVG"
                          >
                            <Download size={13} />
                          </button>
                          <button
                            className="icon-btn icon-btn-danger"
                            onClick={() => removeIcon(icon)}
                            aria-label={`Remove ${icon.name}`}
                            title="Remove icon"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {isMismatch && (
                        <button
                          className="btn btn-regenerate"
                          onClick={() => regenerate(icon)}
                          disabled={isRegenerating}
                        >
                          <Sparkles size={12.5} />
                          {isRegenerating ? "Regenerating..." : "Regenerate to match"}
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="sets-empty-state">
                <div className="empty-state-badge">
                  <Layers size={24} strokeWidth={1.75} />
                </div>
                <h2 className="empty-state-title">This set has no icons yet</h2>
                <p className="empty-state-copy">
                  Generate one in the workspace and add it here.
                </p>
                <Link href="/create" className="btn btn-primary">
                  <Plus size={15} /> Create icon
                </Link>
              </div>
            )}
          </section>

          <aside className="set-sidebar">
            <div className="inspector-panel style-system-card">
              <div className="inspector-header">
                <div className="eyebrow eyebrow-neutral">Style system</div>
                <span className="profile-name-badge">Forge Style</span>
              </div>

              <div className="spec-table">
                <div className="spec-row">
                  <span className="spec-label">Canvas</span>
                  <span className="spec-val">{profile.canvas} × {profile.canvas}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Stroke</span>
                  <span className="spec-val">{profile.stroke} px</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Cap</span>
                  <span className="spec-val">{profile.cap}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Join</span>
                  <span className="spec-val">{profile.join}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Fill</span>
                  <span className="spec-val">{profile.fillMode}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Complexity</span>
                  <span className="spec-val">{profile.complexity}</span>
                </div>
              </div>
            </div>

            {analysisError && (
              <div className="generation-error lock-banner" role="alert">
                <span>{analysisError}</span>
                <button className="btn" onClick={runConsistency}>
                  Retry
                </button>
              </div>
            )}

            {result ? (
              <div className="inspector-panel consistency-card">
                <div className="inspector-header">
                  <div className="eyebrow eyebrow-neutral">Consistency</div>
                  <span
                    className={`score-badge ${
                      result.score === 100 ? "score-badge-perfect" : "score-badge-warn"
                    }`}
                  >
                    {result.score === 100 ? "Cohesive" : "Mismatched"}
                  </span>
                </div>

                <div className={`consistency-score-hero ${result.score === 100 ? "score-hero-perfect" : ""}`}>
                  <div className="score-num-wrap">
                    <span className={`score-value ${result.score === 100 ? "score-value-perfect" : ""}`}>{result.score}</span>
                    <span className="score-denom">/ 100</span>
                  </div>
                  <p className={`score-subtext ${result.score === 100 ? "score-subtext-perfect" : ""}`}>
                    {result.score === 100 ? "All icons match reference style" : "Consistency score"}
                  </p>
                </div>

                <div className="audit-checklist">
                  {result.checks.map((check) => {
                    const isGood = check.status === "good";
                    return (
                      <div className="audit-check-item" key={check.label}>
                        <span className="check-title">{check.label}</span>
                        <span className={`check-outcome ${isGood ? "check-pass" : "check-flag"}`}>
                          {isGood ? <Check size={11} strokeWidth={2.5} /> : <AlertTriangle size={11} strokeWidth={2.5} />}
                          {check.result}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {findings.length > 0 && (
                  <div className="findings-container">
                    <div className="findings-title">Diagnosis per icon</div>
                    <div className="findings-scroll">
                      {findings.map((finding: ConsistencyFinding) => (
                        <div
                          className={`finding-item ${finding.mismatch ? "finding-item-mismatch" : ""}`}
                          key={finding.iconId}
                        >
                          <div className="finding-msg">{finding.message}</div>
                          {finding.reasons && finding.reasons.length > 0 && (
                            <div className="finding-tags">
                              {finding.reasons.map((r, i) => (
                                <span className="finding-tag" key={i}>{r}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="sidebar-actions">
                  <button
                    className="btn btn-primary"
                    style={{ width: "100%", marginBottom: 8 }}
                    onClick={runConsistency}
                    disabled={checking}
                  >
                    {checking ? "Checking..." : "Run again"}
                  </button>
                  <button
                    className="btn"
                    style={{ width: "100%" }}
                    onClick={handleDownloadAll}
                    disabled={exporting}
                  >
                    <Download size={13.5} /> Download all SVGs
                  </button>
                </div>
              </div>
            ) : (
              <div className="inspector-panel consistency-prompt-card">
                <div className="inspector-header">
                  <div className="eyebrow eyebrow-neutral">Consistency</div>
                </div>
                <h3 className="prompt-title">Heuristic style audit</h3>
                <p className="prompt-text">
                  Analyze stroke weights, canvas bounds, corner rounding, and path complexity against Forge Style.
                </p>
                <div className="sidebar-actions">
                  <button
                    className="btn btn-primary"
                    style={{ width: "100%", marginBottom: 8 }}
                    onClick={runConsistency}
                    disabled={checking}
                  >
                    {checking ? "Checking..." : "Check consistency"}
                  </button>
                  <button
                    className="btn"
                    style={{ width: "100%" }}
                    onClick={handleDownloadAll}
                    disabled={exporting}
                  >
                    <Download size={13.5} /> Download all SVGs
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
      {toast && (
        <div
          className={`toast ${toast.type === "error" ? "toast-error" : ""}`}
          role={toast.type === "error" ? "alert" : "status"}
          style={toast.type === "error" ? { background: "#ea580c", color: "#ffffff" } : undefined}
        >
          {toast.type === "error" ? (
            <AlertTriangle size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
          ) : (
            <Check size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
          )}
          {toast.message}
        </div>
      )}
    </main>
  );
}

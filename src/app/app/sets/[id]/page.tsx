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
import { use, useEffect, useRef, useState } from "react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { consistencyScore, type ConsistencyFinding } from "@/lib/consistency";
import { downloadAllIconsAsZip } from "@/lib/export";
import { mockGenerator } from "@/lib/generator";
import { defaultStyleProfile, loadSets, saveSets } from "@/lib/sets";
import type { IconCandidate, IconSet } from "@/lib/types";

function fileName(name: string) { return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "icon"; }
function profileFor(set: IconSet) { return { ...defaultStyleProfile, ...set.profile }; }
function downloadSvg(icon: IconCandidate) { const url = URL.createObjectURL(new Blob([icon.svg], { type: "image/svg+xml" })); const link = document.createElement("a"); link.href = url; link.download = `${fileName(icon.name)}.svg`; link.click(); URL.revokeObjectURL(url); }

function isValidCandidate(candidate: unknown): candidate is IconCandidate {
  if (!candidate || typeof candidate !== "object") return false;
  const c = candidate as Partial<IconCandidate>;
  if (typeof c.svg !== "string" || !c.svg.includes("<svg") || !c.svg.includes("</svg>")) return false;
  if (typeof c.canvas !== "number" || c.canvas <= 0) return false;
  if (typeof c.stroke !== "number" || c.stroke <= 0) return false;
  return true;
}

export default function SetDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [set, setSet] = useState<IconSet | null>(null);
  const [result, setResult] = useState<ReturnType<typeof consistencyScore> | null>(null);
  const [checking, setChecking] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [proposedReplacements, setProposedReplacements] = useState<Record<string, IconCandidate>>({});
  const [previewOriginalMap, setPreviewOriginalMap] = useState<Record<string, boolean>>({});
  const sidebarRef = useRef<HTMLElement | null>(null);
  const checkedFingerprintRef = useRef<string>("");

  useEffect(() => {
    function updateSidebarHeight() {
      if (typeof window === "undefined" || window.innerWidth <= 1100) return;
      const sidebar = sidebarRef.current;
      if (!sidebar) return;
      const topOffset = 72;
      const bottomSpacing = 16;
      const rect = sidebar.getBoundingClientRect();
      const currentTop = Math.max(topOffset, rect.top);
      const availableHeight = Math.max(200, Math.floor(window.innerHeight - currentTop - bottomSpacing));
      sidebar.style.setProperty("--sidebar-max-height", `${availableHeight}px`);
    }

    updateSidebarHeight();
    window.addEventListener("scroll", updateSidebarHeight, { passive: true });
    window.addEventListener("resize", updateSidebarHeight, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateSidebarHeight);
      window.removeEventListener("resize", updateSidebarHeight);
    };
  }, [set, result, analysisError]);

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
  useEffect(() => {
    if (!set || !result || !checkedFingerprintRef.current) return;
    const currentFingerprint = JSON.stringify({
      icons: set.icons.map((i) => ({
        id: i.id,
        name: i.name,
        stroke: i.stroke,
        canvas: i.canvas,
        style: i.style,
        complexity: i.complexity,
        svg: i.svg,
      })),
      profile: profileFor(set),
    });
    if (checkedFingerprintRef.current !== currentFingerprint) {
      setResult(null);
      checkedFingerprintRef.current = "";
    }
  }, [set, result]);
  if (!set) return <main className="app-shell"><div className="page-content"><p className="muted">Set not found.</p><Link href="/sets" className="btn">Back to sets</Link></div></main>;
  const currentSet = set;
  const profile = profileFor(currentSet);
  function persist(next: IconSet) {
    const updated = { ...next, updatedAt: new Date().toISOString() };
    setSet(updated);
    saveSets(loadSets().map((item) => (item.id === updated.id ? updated : item)));
    setResult(null);
    checkedFingerprintRef.current = "";
  }
  function runConsistency() {
    if (checking) return;
    setChecking(true);
    setAnalysisError("");
    window.setTimeout(() => {
      try {
        const evaluated = consistencyScore(currentSet.icons, profile);
        setResult(evaluated);
        checkedFingerprintRef.current = JSON.stringify({
          icons: currentSet.icons.map((i) => ({
            id: i.id,
            name: i.name,
            stroke: i.stroke,
            canvas: i.canvas,
            style: i.style,
            complexity: i.complexity,
            svg: i.svg,
          })),
          profile,
        });
      } catch {
        setResult(null);
        checkedFingerprintRef.current = "";
        setAnalysisError("Consistency analysis could not be completed.");
      } finally {
        setChecking(false);
      }
    }, 120);
  }
  function renameSet() { const name = window.prompt("Rename icon set", currentSet.name); if (name?.trim()) persist({ ...currentSet, name: name.trim() }); }
  function renameIcon(icon: IconCandidate) { const name = window.prompt("Rename icon", icon.name); if (name?.trim()) persist({ ...currentSet, icons: currentSet.icons.map((item) => item.id === icon.id ? { ...item, name: name.trim() } : item) }); }
  function removeIcon(icon: IconCandidate) { persist({ ...currentSet, icons: currentSet.icons.filter((item) => item.id !== icon.id) }); }
  function move(index: number, direction: -1 | 1) { const target = index + direction; if (target < 0 || target >= currentSet.icons.length) return; const icons = [...currentSet.icons]; [icons[index], icons[target]] = [icons[target], icons[index]]; persist({ ...currentSet, icons }); }
  async function regenerate(icon: IconCandidate) {
    setBusy(icon.id);
    try {
      const payload = {
        prompt: icon.name,
        style: profile.fillMode,
        canvas: profile.canvas,
        stroke: profile.stroke,
        complexity: profile.complexity,
        color: "Current Color" as const,
        lockedStyle: {
          ...profile,
          stroke: profile.stroke,
          strokeWidth: profile.stroke,
          canvas: profile.canvas,
          fillMode: profile.fillMode,
          cap: profile.cap,
          strokeLinecap: profile.strokeLinecap,
          join: profile.join,
          strokeLinejoin: profile.strokeLinejoin,
          complexity: profile.complexity,
        },
        styleReference: {
          pathCount: icon.pathCount,
          viewBox: "0 0 24 24" as const,
          svg: icon.svg,
        },
      };

      let candidate: IconCandidate | null = null;
      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          const data = (await response.json()) as { candidates?: IconCandidate[]; error?: string };
          if (data.candidates && data.candidates.length > 0 && isValidCandidate(data.candidates[0])) {
            candidate = data.candidates[0];
          }
        }
      } catch {
        // Fallback to local mock generator if API is unavailable
      }

      if (!candidate) {
        const mockResults = mockGenerator.generateIcons(payload);
        if (mockResults.length > 0 && isValidCandidate(mockResults[0])) {
          candidate = mockResults[0];
        }
      }

      if (!candidate || !isValidCandidate(candidate)) {
        throw new Error("Could not generate valid candidate");
      }

      const proposalCandidate: IconCandidate = {
        ...candidate,
        id: `proposal-${icon.id}-${Date.now()}`,
        name: icon.name,
        canvas: profile.canvas,
        stroke: profile.stroke,
        style: profile.fillMode,
        complexity: profile.complexity,
      };

      setProposedReplacements((prev) => ({
        ...prev,
        [icon.id]: proposalCandidate,
      }));
      setPreviewOriginalMap((prev) => ({
        ...prev,
        [icon.id]: false,
      }));
      showToast("Proposed replacement ready for review", "success");
    } catch {
      showToast("Could not regenerate icon", "error");
    } finally {
      setBusy(null);
    }
  }

  function acceptProposal(iconId: string) {
    const proposal = proposedReplacements[iconId];
    if (!proposal) return;

    const original = currentSet.icons.find((item) => item.id === iconId);
    if (!original) return;

    const accepted: IconCandidate = {
      ...proposal,
      id: original.id,
      name: original.name,
      label: "Regenerated match",
    };

    const updatedIcons = currentSet.icons.map((item) => (item.id === iconId ? accepted : item));
    const updatedSet = { ...currentSet, icons: updatedIcons, updatedAt: new Date().toISOString() };

    setSet(updatedSet);
    saveSets(loadSets().map((item) => (item.id === updatedSet.id ? updatedSet : item)));

    setProposedReplacements((prev) => {
      const next = { ...prev };
      delete next[iconId];
      return next;
    });
    setPreviewOriginalMap((prev) => {
      const next = { ...prev };
      delete next[iconId];
      return next;
    });

    setResult(null);
    checkedFingerprintRef.current = "";
    showToast(`Replaced and saved ${original.name}`, "success");
  }



  function discardProposal(iconId: string) {
    setProposedReplacements((prev) => {
      const next = { ...prev };
      delete next[iconId];
      return next;
    });
    setPreviewOriginalMap((prev) => {
      const next = { ...prev };
      delete next[iconId];
      return next;
    });
    showToast("Kept previous icon", "success");
  }

  function togglePreviewOriginal(iconId: string) {
    setPreviewOriginalMap((prev) => ({
      ...prev,
      [iconId]: !prev[iconId],
    }));
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
            <button
              className="btn btn-ghost"
              onClick={renameSet}
              title="Rename icon set"
            >
              <Pencil size={13.5} /> Rename
            </button>
            <button
              className="btn"
              onClick={handleExportSet}
              disabled={exporting}
              title="Export set as ZIP archive"
            >
              <Download size={13.5} /> Export set
            </button>
            <button
              className={`btn ${
                result === null
                  ? ""
                  : result.findings.some((f) => f.mismatch)
                  ? "btn-warning-state"
                  : "btn-success-state"
              }`}
              onClick={runConsistency}
              disabled={checking}
            >
              {checking ? (
                "Checking..."
              ) : result !== null && !result.findings.some((f) => f.mismatch) ? (
                <>
                  <Check size={14} /> Consistent
                </>
              ) : result !== null && result.findings.some((f) => f.mismatch) ? (
                <>
                  <AlertTriangle size={14} /> Mismatches found
                </>
              ) : (
                "Check consistency"
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
                  const proposal = proposedReplacements[icon.id];
                  const showOriginal = previewOriginalMap[icon.id] ?? false;
                  const displayedIcon = proposal && !showOriginal ? proposal : icon;
                  const isProposed = Boolean(proposal);

                  return (
                    <article
                      className={`icon-card ${isProposed ? "icon-card-proposed" : isMismatch ? "icon-card-mismatch" : ""}`}
                      key={icon.id}
                    >
                      <div className="icon-card-preview-stage">
                        <div
                          className="icon-card-svg"
                          dangerouslySetInnerHTML={{ __html: displayedIcon.svg }}
                        />
                        {isProposed ? (
                          <>
                            <div className="proposal-badge">
                              <Sparkles size={11} /> Proposed match
                            </div>
                            <button
                              type="button"
                              className="proposal-toggle-btn"
                              onClick={() => togglePreviewOriginal(icon.id)}
                              title={showOriginal ? "Click to view proposed candidate" : "Click to view original icon"}
                            >
                              {showOriginal ? "Viewing original" : "Viewing proposed"}
                            </button>
                          </>
                        ) : isMismatch ? (
                          <div className="mismatch-badge">
                            <AlertTriangle size={11} /> Mismatch
                          </div>
                        ) : null}
                      </div>

                      <div className="icon-card-info">
                        <div className="icon-card-name" title={icon.name}>
                          {icon.name}
                        </div>
                        <div className="icon-card-meta">
                          <span>{displayedIcon.canvas} × {displayedIcon.canvas}</span>
                          <span className="spec-dot">·</span>
                          <span>{displayedIcon.stroke}px</span>
                          <span className="spec-dot">·</span>
                          <span>{displayedIcon.style}</span>
                        </div>

                        {isProposed ? (
                          <>
                            <div className="proposal-status-match">
                              ✓ Matches set specifications
                            </div>
                            <div className="proposal-notice" style={{ fontSize: "10.5px", color: "var(--muted)", lineHeight: 1.3, marginTop: "2px" }}>
                              Original icon has not been replaced yet.
                            </div>
                          </>
                        ) : isMismatch && finding?.reasons && finding.reasons.length > 0 ? (
                          <div className="mismatch-reasons" title={finding.reasons.join(", ")}>
                            {finding.reasons.join(" · ")}
                          </div>
                        ) : null}
                      </div>

                      <div className="icon-card-bottom">
                        <div className="icon-card-order-actions">
                          <button
                            className="icon-btn"
                            onClick={() => move(index, -1)}
                            disabled={index === 0 || isRegenerating || isProposed}
                            aria-label={`Move ${icon.name} up`}
                            title="Move earlier"
                          >
                            <ArrowUp size={12.5} />
                          </button>
                          <button
                            className="icon-btn"
                            onClick={() => move(index, 1)}
                            disabled={index === set.icons.length - 1 || isRegenerating || isProposed}
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
                            disabled={isRegenerating || isProposed}
                            aria-label={`Rename ${icon.name}`}
                            title="Rename icon"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            className="icon-btn"
                            onClick={() => downloadSvg(displayedIcon)}
                            disabled={isRegenerating}
                            aria-label={`Download ${icon.name}`}
                            title="Download SVG"
                          >
                            <Download size={13} />
                          </button>
                          <button
                            className="icon-btn icon-btn-danger"
                            onClick={() => removeIcon(icon)}
                            disabled={isRegenerating || isProposed}
                            aria-label={`Remove ${icon.name}`}
                            title="Remove icon"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {isProposed ? (
                        <div className="proposal-actions">
                          <button
                            type="button"
                            className="btn btn-keep-proposal"
                            onClick={() => acceptProposal(icon.id)}
                            disabled={isRegenerating}
                          >
                            <Check size={13} strokeWidth={2.5} /> Keep this
                          </button>
                          <button
                            type="button"
                            className="btn btn-regenerate-again"
                            onClick={() => regenerate(icon)}
                            disabled={isRegenerating}
                          >
                            <Sparkles size={12.5} className={isRegenerating ? "spin-icon" : ""} />
                            {isRegenerating ? "Regenerating to match…" : "Regenerate again"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-discard-proposal"
                            onClick={() => discardProposal(icon.id)}
                            disabled={isRegenerating}
                          >
                            Keep previous
                          </button>
                        </div>
                      ) : isMismatch ? (
                        <button
                          type="button"
                          className="btn btn-regenerate"
                          onClick={() => regenerate(icon)}
                          disabled={isRegenerating}
                        >
                          <Sparkles size={12.5} className={isRegenerating ? "spin-icon" : ""} />
                          {isRegenerating ? "Regenerating to match…" : "Regenerate to match"}
                        </button>
                      ) : null}
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

          <aside className="set-sidebar" ref={sidebarRef}>
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
                    {result.score === 100 ? "Style fully matched" : "Mismatched"}
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
                <h3 className="prompt-title">Style consistency check</h3>
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

"use client";

import JSZip from "jszip";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, Download, Pencil, Trash2 } from "lucide-react";
import { use, useEffect, useState } from "react";
import { consistencyScore, type ConsistencyFinding } from "@/lib/consistency";
import { defaultStyleProfile, loadSets, saveSets } from "@/lib/sets";
import type { IconCandidate, IconSet } from "@/lib/types";

function fileName(name: string) { return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "icon"; }
function profileFor(set: IconSet) { return { ...defaultStyleProfile, ...set.profile }; }
function downloadSvg(icon: IconCandidate) { const url = URL.createObjectURL(new Blob([icon.svg], { type: "image/svg+xml" })); const link = document.createElement("a"); link.href = url; link.download = `${fileName(icon.name)}.svg`; link.click(); URL.revokeObjectURL(url); }
async function downloadZip(set: IconSet) { const zip = new JSZip(); set.icons.forEach((icon) => zip.file(`${fileName(icon.name)}.svg`, icon.svg)); const blob = await zip.generateAsync({ type: "blob" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${fileName(set.name)}.zip`; link.click(); URL.revokeObjectURL(url); }

export default function SetDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [set, setSet] = useState<IconSet | null>(null);
  const [result, setResult] = useState<ReturnType<typeof consistencyScore> | null>(null);
  const [checking, setChecking] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
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
    if (!window.confirm(`Generate a replacement for ${icon.name} using ${profile.name}?`)) return;
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
  return <main className="app-shell"><header className="topbar"><Link href="/sets" className="brand"><ArrowLeft size={16} /> Icon sets</Link><Link href="/create" className="btn btn-primary">Create icon</Link></header><div className="page-content"><div className="page-header"><div><div className="eyebrow">Icon set</div><h1>{set.name}</h1>{set.description && <p className="muted" style={{ margin: 0 }}>{set.description}</p>}<p className="muted" style={{ margin: "6px 0 0" }}>{set.icons.length} icons · {profile.canvas} × {profile.canvas} · {profile.stroke} px · {profile.fillMode}</p></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="btn" onClick={renameSet}><Pencil size={14} /> Rename</button><button className="btn" onClick={() => downloadZip(set)}><Download size={14} /> Export set</button><button className="btn btn-primary" onClick={runConsistency} disabled={checking}>{checking ? "Checking..." : "Check consistency"}</button></div></div><div className="set-detail-layout"><section><div className="icon-grid">{set.icons.length ? set.icons.map((icon, index) => { const finding = findings.find((item) => item.iconId === icon.id); return <article className={`icon-card ${finding?.mismatch ? "icon-card-mismatch" : ""}`} key={icon.id}><div className="icon-card-preview" dangerouslySetInnerHTML={{ __html: icon.svg }} /><div className="set-name">{icon.name}</div><div className="set-meta">{icon.label} · {icon.canvas} × {icon.canvas} · {icon.stroke} px · {icon.style}</div>{finding?.mismatch && <div className="mismatch-label">Style mismatch{finding.reasons?.length ? ` · ${finding.reasons.join(", ")}` : ""}</div>}<div className="icon-card-actions"><button className="icon-btn" onClick={() => move(index, -1)} aria-label={`Move ${icon.name} up`}><ArrowUp size={13} /></button><button className="icon-btn" onClick={() => move(index, 1)} aria-label={`Move ${icon.name} down`}><ArrowDown size={13} /></button><button className="icon-btn" onClick={() => renameIcon(icon)} aria-label={`Rename ${icon.name}`}><Pencil size={13} /></button><button className="icon-btn" onClick={() => downloadSvg(icon)} aria-label={`Download ${icon.name}`}><Download size={13} /></button><button className="icon-btn" onClick={() => removeIcon(icon)} aria-label={`Remove ${icon.name}`}><Trash2 size={13} /></button>{finding?.mismatch && <button className="btn" onClick={() => regenerate(icon)} disabled={busy === icon.id}>{busy === icon.id ? "Regenerating..." : "Regenerate to match"}</button>}</div></article>; }) : <div className="consistency"><p className="muted">This set has no icons yet. Generate one in the workspace and add it here.</p><Link href="/create" className="btn btn-primary">Create icon</Link></div>}</div></section><aside className="consistency"><div className="eyebrow">Style system</div><h2 style={{ margin: "8px 0 12px", fontSize: 18 }}>{profile.name}</h2><div className="style-profile-grid"><span>Canvas</span><strong>{profile.canvas} × {profile.canvas}</strong><span>Stroke</span><strong>{profile.stroke} px</strong><span>Cap</span><strong>{profile.cap}</strong><span>Join</span><strong>{profile.join}</strong><span>Fill</span><strong>{profile.fillMode}</strong><span>Complexity</span><strong>{profile.complexity}</strong></div>{analysisError && <div className="generation-error lock-banner" role="alert"><span>{analysisError}</span><button className="btn" onClick={runConsistency}>Retry</button></div>}{result && <div className="consistency-report"><div className="eyebrow">Consistency</div><div className="score">{result.score} <span style={{ fontSize: 18, color: "var(--muted)", fontWeight: 500 }}>/ 100</span></div><p className="muted">Heuristic score</p><div className="check-grid">{result.checks.map((check) => <div className="check-item" key={check.label}><span>{check.label}</span><span>{check.status === "good" ? "✓" : "⚠"} {check.result}</span></div>)}</div><div className="finding-list">{result.findings.map((finding: ConsistencyFinding) => <div className={`finding ${finding.mismatch ? "finding-warn" : ""}`} key={finding.iconId}>{finding.message}{finding.mismatch && <span>Style mismatch</span>}</div>)}</div><button className="btn" onClick={runConsistency}>Run again</button></div>}<div className="actions" style={{ marginTop: 18 }}><button className="btn" onClick={runConsistency} disabled={checking}>{checking ? "Checking..." : "Check consistency"}</button><button className="btn" onClick={() => downloadZip(set)}><Download size={14} /> Download all SVGs</button></div></aside></div></div></main>;
}

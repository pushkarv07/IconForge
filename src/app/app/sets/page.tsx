"use client";

import JSZip from "jszip";
import Link from "next/link";
import { ArrowRight, Copy, Download, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { defaultStyleProfile, loadSets, makeSet, saveSets } from "@/lib/sets";
import type { IconSet } from "@/lib/types";

function fileName(name: string) { return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "icon"; }
async function downloadZip(set: IconSet) { const zip = new JSZip(); set.icons.forEach((icon) => zip.file(`${fileName(icon.name)}.svg`, icon.svg)); const blob = await zip.generateAsync({ type: "blob" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${fileName(set.name)}.zip`; link.click(); URL.revokeObjectURL(url); }

export default function SetsPage() {
  const [sets, setSets] = useState<IconSet[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  useEffect(() => setSets(loadSets()), []);
  function persist(next: IconSet[]) { setSets(next); saveSets(next); }
  function createSet(event: React.FormEvent) { event.preventDefault(); if (!name.trim()) return; persist([...sets, makeSet(name.trim(), description.trim(), defaultStyleProfile)]); setName(""); setDescription(""); setDialogOpen(false); }
  function rename(set: IconSet) { const nextName = window.prompt("Rename icon set", set.name); if (nextName?.trim()) persist(sets.map((item) => item.id === set.id ? { ...item, name: nextName.trim(), updatedAt: new Date().toISOString() } : item)); }
  function duplicate(set: IconSet) { persist([...sets, { ...set, id: `${Date.now()}`, name: `${set.name} copy`, icons: [...set.icons], updatedAt: new Date().toISOString() }]); }
  function remove(set: IconSet) { if (window.confirm(`Delete ${set.name}?`)) persist(sets.filter((item) => item.id !== set.id)); }
  return (
    <main className="app-shell">
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark">IF</span> IconForge
        </Link>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <ThemeSwitcher />
          <Link href="/create" className="btn btn-quiet">
            Workspace
          </Link>
          <button className="btn btn-primary" onClick={() => setDialogOpen(true)}>
            <Plus size={15} /> New set
          </button>
        </div>
      </header>

      <div className="page-content">
        <div className="page-header">
          <div>
            <div className="eyebrow">Your library</div>
            <h1>Icon sets</h1>
            <p className="page-header-desc">
              Keep related icons together and consistent.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setDialogOpen(true)}>
            <Plus size={15} /> New set
          </button>
        </div>

        {sets.length ? (
          <div className="set-grid">
            {sets.map((set) => {
              const displayIcons =
                set.icons.length > 5 ? set.icons.slice(0, 4) : set.icons.slice(0, 5);
              const overflowCount = set.icons.length > 5 ? set.icons.length - 4 : 0;
              return (
                <article className="set-card" key={set.id}>
                  <div className="set-card-body">
                    <div className="set-card-header">
                      <Link href={`/sets/${set.id}`} className="set-card-title-link">
                        <h2 className="set-name">{set.name}</h2>
                      </Link>
                      <p className={`set-desc ${!set.description ? "muted-empty" : ""}`}>
                        {set.description || "No description provided"}
                      </p>
                    </div>

                    <div className="set-specs">
                      <div className="set-spec-line">
                        <span className="set-spec-count">
                          {set.icons.length} {set.icons.length === 1 ? "icon" : "icons"}
                        </span>
                        <span className="spec-dot">·</span>
                        <span className="set-spec-canvas">
                          {set.profile.canvas} × {set.profile.canvas}
                        </span>
                      </div>
                      <div className="set-spec-line">
                        <span className="set-spec-stroke">{set.profile.stroke} px</span>
                        <span className="spec-dot">·</span>
                        <span className="set-spec-fill">{set.profile.fillMode}</span>
                      </div>
                    </div>

                    <Link
                      href={`/sets/${set.id}`}
                      className="set-preview-strip"
                      aria-label={`Preview ${set.name}`}
                    >
                      {set.icons.length ? (
                        <div className="set-preview-tiles">
                          {displayIcons.map((icon) => (
                            <div
                              key={icon.id}
                              className="set-preview-tile"
                              dangerouslySetInnerHTML={{ __html: icon.svg }}
                            />
                          ))}
                          {overflowCount > 0 && (
                            <div className="set-preview-tile set-preview-more">
                              <span>+{overflowCount}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="set-preview-empty">
                          <span>No icons yet</span>
                        </div>
                      )}
                    </Link>
                  </div>

                  <div className="set-card-footer">
                    <Link href={`/sets/${set.id}`} className="set-open-link">
                      Open <ArrowRight size={13} />
                    </Link>
                    <div className="set-card-actions">
                      <button
                        className="icon-btn"
                        onClick={() => rename(set)}
                        aria-label={`Rename ${set.name}`}
                        title="Rename set"
                      >
                        <Pencil size={13.5} />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => duplicate(set)}
                        aria-label={`Duplicate ${set.name}`}
                        title="Duplicate set"
                      >
                        <Copy size={13.5} />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => downloadZip(set)}
                        aria-label={`Export ${set.name}`}
                        title="Export set"
                      >
                        <Download size={13.5} />
                      </button>
                      <button
                        className="icon-btn icon-btn-danger"
                        onClick={() => remove(set)}
                        aria-label={`Delete ${set.name}`}
                        title="Delete set"
                      >
                        <Trash2 size={13.5} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="sets-empty-state">
            <div className="empty-state-badge">
              <Layers size={24} strokeWidth={1.75} />
            </div>
            <h2 className="empty-state-title">Create your first icon set</h2>
            <p className="empty-state-copy">
              Group your generated icons into cohesive collections, check consistency across stroke weights and canvas dimensions, and export ready-to-use packages.
            </p>
            <button className="btn btn-primary" onClick={() => setDialogOpen(true)}>
              <Plus size={15} /> New set
            </button>
          </div>
        )}
      </div>

      {dialogOpen && (
        <div className="modal-backdrop" role="presentation">
          <form className="modal" onSubmit={createSet}>
            <div className="eyebrow">New collection</div>
            <h2 className="property-title">Create icon set</h2>
            <label className="field-label" htmlFor="set-name">
              Set name
            </label>
            <input
              id="set-name"
              className="textarea"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              required
            />
            <label className="field-label" htmlFor="set-description">
              Description <span className="muted">(optional)</span>
            </label>
            <textarea
              id="set-description"
              className="textarea"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setDialogOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" type="submit">
                Create set
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

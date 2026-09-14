import type { IconSet, StyleProfile } from "./types";

const storageKey = "iconforge-sets";

export const defaultStyleProfile: StyleProfile = {
  name: "Untitled style",
  canvas: 24,
  stroke: 1.5,
  strokeWidth: 1.5,
  cap: "Rounded",
  strokeLinecap: "Rounded",
  join: "Rounded",
  strokeLinejoin: "Rounded",
  fillMode: "Outline",
  complexity: "Simple",
  density: "Balanced",
  corner: "Soft",
  weight: 42,
  opticalWeight: 42,
  geometric: "Mixed",
};

export function loadSets(): IconSet[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(storageKey) ?? "[]") as IconSet[]; } catch { return []; }
}

export function saveSets(sets: IconSet[]) {
  localStorage.setItem(storageKey, JSON.stringify(sets));
}

export function makeSet(name: string, description = "", profile = defaultStyleProfile): IconSet {
  const now = new Date().toISOString();
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, description, icons: [], profile: { ...profile }, createdAt: now, updatedAt: now };
}
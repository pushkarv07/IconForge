import JSZip from "jszip";
import type { IconCandidate, IconSet } from "./types";

export function sanitizeFileName(name: string): string {
  const sanitized = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return sanitized || "icon";
}

/**
 * Generates unique, deterministic filenames with .svg extension for an array of icons.
 * Handles duplicate names by appending a -2, -3, ... suffix.
 * Avoids any filename collisions.
 */
export function generateUniqueFileNames(
  icons: Pick<IconCandidate, "name" | "id">[]
): string[] {
  const seenCounts = new Map<string, number>();
  const usedFileNames = new Set<string>();
  const results: string[] = [];

  for (let i = 0; i < icons.length; i++) {
    const icon = icons[i];
    const base = sanitizeFileName(icon.name || "");
    const count = (seenCounts.get(base) || 0) + 1;
    seenCounts.set(base, count);

    let candidate = count === 1 ? `${base}.svg` : `${base}-${count}.svg`;

    // Handle collision if an existing icon name already had an exact matching suffix
    let clashCounter = count + 1;
    while (usedFileNames.has(candidate)) {
      candidate = `${base}-${clashCounter}.svg`;
      clashCounter++;
    }

    usedFileNames.add(candidate);
    results.push(candidate);
  }

  return results;
}

export interface ExportZipResult {
  zipBlob: Blob;
  zipFileName: string;
  entryCount: number;
  fileNames: string[];
}

/**
 * Validates each icon's SVG, generates unique filenames, builds a JSZip archive,
 * and asserts that the archive entry count equals the set icon count.
 */
export async function buildIconSetZip(set: IconSet): Promise<ExportZipResult> {
  if (!set.icons || set.icons.length === 0) {
    throw new Error("Cannot export: Icon set has no icons.");
  }

  const expectedCount = set.icons.length;
  const uniqueNames = generateUniqueFileNames(set.icons);

  if (uniqueNames.length !== expectedCount) {
    throw new Error(
      `Export error: filename count (${uniqueNames.length}) does not match icon count (${expectedCount}).`
    );
  }

  const zip = new JSZip();

  for (let i = 0; i < set.icons.length; i++) {
    const icon = set.icons[i];
    const fileName = uniqueNames[i];

    if (!icon.svg || typeof icon.svg !== "string" || !icon.svg.trim()) {
      throw new Error(
        `Invalid SVG data for icon "${icon.name || icon.id || i + 1}": SVG content is empty.`
      );
    }

    const trimmedSvg = icon.svg.trim();
    if (!trimmedSvg.includes("<svg") || !trimmedSvg.includes("</svg>")) {
      throw new Error(
        `Invalid SVG data for icon "${icon.name || icon.id || i + 1}": Missing SVG tags.`
      );
    }

    zip.file(fileName, trimmedSvg);
  }

  // Verify the final ZIP entry count equals the set icon count
  const zipEntries = Object.keys(zip.files).filter((name) => !zip.files[name].dir);
  if (zipEntries.length !== expectedCount) {
    throw new Error(
      `Export verification failed: Archive contains ${zipEntries.length} files, but set has ${expectedCount} icons.`
    );
  }

  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const zipFileName = `${sanitizeFileName(set.name || "icon-set")}.zip`;

  return {
    zipBlob,
    zipFileName,
    entryCount: zipEntries.length,
    fileNames: uniqueNames,
  };
}

/**
 * Triggers a download in the browser for a given Blob.
 */
export function triggerBlobDownload(blob: Blob, fileName: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * High-level helper to build the ZIP and trigger browser download.
 * Returns the number of SVGs exported.
 */
export async function downloadAllIconsAsZip(set: IconSet): Promise<number> {
  const result = await buildIconSetZip(set);
  triggerBlobDownload(result.zipBlob, result.zipFileName);
  return result.entryCount;
}

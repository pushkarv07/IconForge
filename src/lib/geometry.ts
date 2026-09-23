import type { GenerationRequest, IconCandidate } from "./types";

export interface IconGeometry {
  canvas: number;
  strokeWidth: number;
  strokeLinecap: "round" | "square" | "butt";
  strokeLinejoin: "round" | "miter" | "bevel";
  fill: "none" | "currentColor";
  paths: { d: string }[];
}

const forbiddenMarkup = /<\/?(?:script|html|foreignObject|img|image|svg|iframe|object|style)\b|data:/i;
const pathToken = /(?:[AaCcHhLlMmQqSsTtVvZz]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?)/g;
const pathCommand = /[AaCcHhLlMmQqSsTtVvZz]/;

function normalizeArcFlags(pathStr: string): string {
  return pathStr.replace(
    /([Aa](?:\s*[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?){3}\s*)([01])([01])(?=[-+.\d])/g,
    "$1$2 $3 "
  );
}

function isValidPathData(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 1000 || !pathCommand.test(value)) return false;
  const normalized = normalizeArcFlags(value);
  const tokens = normalized.match(pathToken);
  if (!tokens || tokens.join("") !== normalized.replace(/[\s,]+/g, "") || /[<>"'`;]|\\/.test(value)) return false;
  const arity: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
  let command = "";
  let numbers = 0;
  for (const token of tokens) {
    if (pathCommand.test(token)) {
      if (numbers > 0 && numbers % arity[command.toUpperCase()] !== 0) return false;
      command = token;
      numbers = 0;
      if (command.toUpperCase() === "Z") continue;
    } else {
      if (!command || command.toUpperCase() === "Z") return false;
      numbers += 1;
    }
  }
  return Boolean(command && command.toUpperCase() !== "Z" ? numbers >= arity[command.toUpperCase()] && numbers % arity[command.toUpperCase()] === 0 : command);
}

export function getGeometryBoundingBox(geometry: IconGeometry): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
  coordCount: number;
} | null {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let coordCount = 0;

  function updatePoint(x: number, y: number) {
    if (!isFinite(x) || !isFinite(y)) return;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    coordCount++;
  }

  for (const path of geometry.paths) {
    const d = typeof path === "string" ? path : path.d;
    if (!d) continue;

    const normalized = normalizeArcFlags(d);
    const tokens = normalized.match(pathToken);
    if (!tokens) continue;

    let curX = 0;
    let curY = 0;
    let startX = 0;
    let startY = 0;
    let cmd = "";
    const args: number[] = [];

    const processCommand = (command: string, params: number[]) => {
      const isRel = command === command.toLowerCase();
      const type = command.toUpperCase();

      switch (type) {
        case "M":
          for (let i = 0; i < params.length; i += 2) {
            const x = isRel ? curX + params[i] : params[i];
            const y = isRel ? curY + params[i + 1] : params[i + 1];
            curX = x;
            curY = y;
            if (i === 0) {
              startX = curX;
              startY = curY;
            }
            updatePoint(curX, curY);
          }
          break;
        case "L":
          for (let i = 0; i < params.length; i += 2) {
            curX = isRel ? curX + params[i] : params[i];
            curY = isRel ? curY + params[i + 1] : params[i + 1];
            updatePoint(curX, curY);
          }
          break;
        case "H":
          for (let i = 0; i < params.length; i++) {
            curX = isRel ? curX + params[i] : params[i];
            updatePoint(curX, curY);
          }
          break;
        case "V":
          for (let i = 0; i < params.length; i++) {
            curY = isRel ? curY + params[i] : params[i];
            updatePoint(curX, curY);
          }
          break;
        case "C":
          for (let i = 0; i < params.length; i += 6) {
            const x1 = isRel ? curX + params[i] : params[i];
            const y1 = isRel ? curY + params[i + 1] : params[i + 1];
            const x2 = isRel ? curX + params[i + 2] : params[i + 2];
            const y2 = isRel ? curY + params[i + 3] : params[i + 3];
            curX = isRel ? curX + params[i + 4] : params[i + 4];
            curY = isRel ? curY + params[i + 5] : params[i + 5];
            updatePoint(x1, y1);
            updatePoint(x2, y2);
            updatePoint(curX, curY);
          }
          break;
        case "S":
        case "Q":
          for (let i = 0; i < params.length; i += 4) {
            const x1 = isRel ? curX + params[i] : params[i];
            const y1 = isRel ? curY + params[i + 1] : params[i + 1];
            curX = isRel ? curX + params[i + 2] : params[i + 2];
            curY = isRel ? curY + params[i + 3] : params[i + 3];
            updatePoint(x1, y1);
            updatePoint(curX, curY);
          }
          break;
        case "T":
          for (let i = 0; i < params.length; i += 2) {
            curX = isRel ? curX + params[i] : params[i];
            curY = isRel ? curY + params[i + 1] : params[i + 1];
            updatePoint(curX, curY);
          }
          break;
        case "A":
          for (let i = 0; i < params.length; i += 7) {
            curX = isRel ? curX + params[i + 5] : params[i + 5];
            curY = isRel ? curY + params[i + 6] : params[i + 6];
            updatePoint(curX, curY);
          }
          break;
        case "Z":
          curX = startX;
          curY = startY;
          break;
      }
    };

    for (const token of tokens) {
      if (pathCommand.test(token)) {
        if (cmd) {
          processCommand(cmd, args);
          args.length = 0;
        }
        cmd = token;
      } else {
        const num = parseFloat(token);
        if (!isNaN(num)) args.push(num);
      }
    }
    if (cmd) {
      processCommand(cmd, args);
    }
  }

  if (coordCount < 2 || !isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
    return null;
  }

  const width = maxX - minX;
  const height = maxY - minY;

  return {
    minX,
    maxX,
    minY,
    maxY,
    width,
    height,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    coordCount,
  };
}

export function hasValidCoordinateBounds(geometry: IconGeometry): boolean {
  const bbox = getGeometryBoundingBox(geometry);
  if (!bbox) return false;

  // Coordinates should be in sensible range for a 24x24 canvas [-2, 26]
  if (bbox.minX < -2 || bbox.maxX > 26 || bbox.minY < -2 || bbox.maxY > 26) {
    return false;
  }

  // Must have reasonable non-zero dimensions (not a microscopic speck or single line)
  if (bbox.width < 3.5 || bbox.height < 3.5) return false;

  // Must not severely overflow standard canvas bounds
  if (bbox.width > 24 || bbox.height > 24) return false;

  return true;
}

export function isSemanticMatch(geometry: IconGeometry, prompt?: string): boolean {
  if (!prompt || !prompt.trim()) return true;
  const p = prompt.toLowerCase().trim();
  const bbox = getGeometryBoundingBox(geometry);
  if (!bbox) return false;

  const combinedPathData = geometry.paths
    .map((path) => (typeof path === "string" ? path : path.d))
    .join(" ");

  // 1. "coffee cup with steam" / "coffee"
  if (p.includes("coffee") || (p.includes("cup") && p.includes("steam"))) {
    const hasCurves = /[AaCcQqSs]/.test(combinedPathData);
    if (!hasCurves) return false;
    if (bbox.minY > 9 || bbox.maxY < 14) return false;
    const subpathCount = (combinedPathData.match(/M/gi) ?? []).length;
    if (geometry.paths.length < 2 && subpathCount < 2) return false;
    return true;
  }

  // 2. "search" / "magnifying"
  if (p.includes("search") || p.includes("magnifying") || p.includes("find")) {
    const hasLens = /[AaCc]/.test(combinedPathData);
    if (!hasLens) return false;
    if (bbox.width < 7 || bbox.height < 7) return false;
    return true;
  }

  // 3. "cloud upload" / "cloud"
  if (p.includes("cloud")) {
    const hasLobes = /[AaCcQq]/.test(combinedPathData);
    if (!hasLobes) return false;
    if (p.includes("upload")) {
      const hasArrow = /[VvLlMm]/.test(combinedPathData);
      if (!hasArrow) return false;
    }
    return true;
  }

  // 4. "shopping cart"
  if (p.includes("cart")) {
    if (bbox.maxY < 16) return false;
    return true;
  }

  // 5. "camera"
  if (p.includes("camera")) {
    const hasLens = /[AaCc]/.test(combinedPathData);
    if (!hasLens) return false;
    if (bbox.width < 9 || bbox.height < 7) return false;
    return true;
  }

  // 6. "location" / "pin" / "marker"
  if (p.includes("location") || p.includes("pin") || p.includes("marker")) {
    if (bbox.minY > 9 || bbox.maxY < 17) return false;
    return true;
  }

  return true;
}

export function validateGeometry(value: unknown, prompt?: string): value is IconGeometry {
  if (!value || typeof value !== "object" || forbiddenMarkup.test(JSON.stringify(value))) return false;
  const geometry = value as Partial<IconGeometry>;
  const isValidBasic =
    geometry.canvas === 24 &&
    typeof geometry.strokeWidth === "number" &&
    geometry.strokeWidth >= 0.5 &&
    geometry.strokeWidth <= 4 &&
    ["round", "square", "butt"].includes(geometry.strokeLinecap ?? "") &&
    ["round", "miter", "bevel"].includes(geometry.strokeLinejoin ?? "") &&
    ["none", "currentColor"].includes(geometry.fill ?? "") &&
    Array.isArray(geometry.paths) &&
    geometry.paths.length > 0 &&
    geometry.paths.length <= 10 &&
    geometry.paths.every((path) => path && isValidPathData(typeof path === "string" ? path : path.d));

  if (!isValidBasic) return false;
  const geom = geometry as IconGeometry;
  if (!hasValidCoordinateBounds(geom)) return false;
  if (prompt && !isSemanticMatch(geom, prompt)) return false;

  return true;
}

export function getGeometryFingerprint(geometry: IconGeometry): string {
  return geometry.paths
    .map((p) => {
      const d = typeof p === "string" ? p : p.d;
      return d
        .replace(/([0-9]+\.[0-9]{2,})/g, (n) => parseFloat(n).toFixed(1))
        .replace(/[\s,]+/g, "")
        .toLowerCase();
    })
    .sort()
    .join("|");
}

export function isDistinctGeometry(candidate: IconGeometry, existing: IconGeometry[]): boolean {
  const candidateFp = getGeometryFingerprint(candidate);
  if (existing.some((e) => getGeometryFingerprint(e) === candidateFp)) return false;

  const cBbox = getGeometryBoundingBox(candidate);
  if (!cBbox) return false;

  for (const item of existing) {
    const iBbox = getGeometryBoundingBox(item);
    if (!iBbox) continue;
    const sameCenter = Math.hypot(cBbox.cx - iBbox.cx, cBbox.cy - iBbox.cy) < 0.25;
    const sameSize = Math.abs(cBbox.width - iBbox.width) < 0.25 && Math.abs(cBbox.height - iBbox.height) < 0.25;
    const samePathCount = candidate.paths.length === item.paths.length;
    if (sameCenter && sameSize && samePathCount) {
      return false;
    }
  }

  return true;
}

export function scoreGeometry(geometry: IconGeometry, prompt: string): number {
  let score = 100;
  const bbox = getGeometryBoundingBox(geometry);
  if (!bbox) return 0;

  const { width, height, minX, maxX, minY, maxY, cx, cy } = bbox;

  // 1. Centeredness: distance from canvas center (12, 12)
  const centerDist = Math.hypot(cx - 12, cy - 12);
  if (centerDist <= 1.2) score += 25;
  else if (centerDist <= 2.5) score += 10;
  else score -= Math.min(30, (centerDist - 2.5) * 12);

  // 2. Optical size at 24x24: ideal icon size is roughly 11-19.5px
  const maxDim = Math.max(width, height);
  if (maxDim >= 11 && maxDim <= 19.5) score += 25;
  else if (maxDim < 9) score -= (9 - maxDim) * 8;
  else if (maxDim > 21) score -= (maxDim - 21) * 10;

  // 3. Aspect ratio balance: reasonable bounds for UI iconography
  const ratio = width / Math.max(height, 0.1);
  if (ratio >= 0.5 && ratio <= 1.8) score += 15;
  else if (ratio < 0.3 || ratio > 3.0) score -= 25;

  // 4. Path structure & clean efficiency (1 to 5 paths is ideal for UI icons)
  if (geometry.paths.length >= 1 && geometry.paths.length <= 5) score += 15;
  else if (geometry.paths.length > 7) score -= 15;

  // 5. Semantic concept specific scoring
  const p = prompt.toLowerCase();
  const pathData = geometry.paths.map((pt) => pt.d).join(" ");

  if (p.includes("coffee") || (p.includes("cup") && p.includes("steam"))) {
    if (minY <= 8 && maxY >= 15 && geometry.paths.length >= 2) score += 35;
    if (/[CcSsQq]/.test(pathData)) score += 15;
  } else if (p.includes("search") || p.includes("magnifying")) {
    const hasLens = /[AaCc]/.test(pathData);
    const reachesCorner = (maxX >= 16 && maxY >= 16) || (minX <= 8 && maxY >= 16);
    if (hasLens && reachesCorner) score += 35;
  } else if (p.includes("cloud")) {
    if (/[AaCc]/.test(pathData)) score += 20;
    if (p.includes("upload") && /[VvLl]/.test(pathData)) score += 20;
  } else if (p.includes("cart")) {
    if (maxY >= 17) score += 30;
  } else if (p.includes("camera")) {
    const hasLens = /[AaCc]/.test(pathData);
    if (hasLens && geometry.paths.length >= 2) score += 30;
  } else if (p.includes("location") || p.includes("pin")) {
    if (minY <= 8 && maxY >= 18) score += 30;
  } else if (p.includes("design")) {
    if (/[LlCcMm]/.test(pathData)) score += 20;
  }

  return Math.max(0, score);
}

export function sortAndSelectBestMatch(
  geometries: IconGeometry[],
  prompt: string
): IconGeometry[] {
  if (geometries.length <= 1) return geometries;
  const scored = geometries.map((geom, idx) => ({
    geom,
    score: scoreGeometry(geom, prompt),
    originalIndex: idx,
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.geom);
}

function styleValues(request: GenerationRequest) {
  const style = request.lockedStyle?.fillMode ?? request.style;
  const fill = style === "Solid" ? "currentColor" : "none";
  return {
    style,
    stroke: request.lockedStyle?.stroke ?? request.stroke,
    canvas: request.lockedStyle?.canvas ?? request.canvas,
    fill,
    opacity: style === "Duotone" ? 0.16 : 1,
  };
}

export function geometryToSvg(geometry: IconGeometry, request: GenerationRequest): string {
  const values = styleValues(request);
  const paths = geometry.paths.map((p) => `<path d="${typeof p === "string" ? p : p.d}"/>`).join("");
  const body = values.style === "Duotone"
    ? `<g opacity="${values.opacity}" fill="currentColor">${paths}</g><g>${paths}</g>`
    : `<g>${paths}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${values.canvas} ${values.canvas}" fill="${values.fill}" stroke="currentColor" stroke-width="${values.stroke}" stroke-linecap="${geometry.strokeLinecap}" stroke-linejoin="${geometry.strokeLinejoin}">${body}</svg>`;
}

export function geometryCandidates(geometries: IconGeometry[], request: GenerationRequest, prompt: string): IconCandidate[] {
  const baseName = prompt.trim().replace(/\s+/g, " ").slice(0, 48) || "Generated icon";
  return geometries.map((geometry, index) => {
    const svg = geometryToSvg(geometry, request);
    return {
      id: `gemini-${Date.now()}-${index}`,
      name: baseName,
      label: index === 0 ? "AI best match" : `AI variation ${index}`,
      svg,
      canvas: request.lockedStyle?.canvas ?? request.canvas,
      stroke: request.lockedStyle?.stroke ?? request.stroke,
      style: request.lockedStyle?.fillMode ?? request.style,
      complexity: request.lockedStyle?.complexity ?? request.complexity,
      pathCount: geometry.paths.length,
      weight: request.lockedStyle?.weight ?? 42,
    };
  });
}

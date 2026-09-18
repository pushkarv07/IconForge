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

function hasValidCoordinateBounds(geometry: IconGeometry): boolean {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let coordCount = 0;

  for (const path of geometry.paths) {
    const d = typeof path === "string" ? path : path.d;
    const numbers = d.match(/[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g);
    if (!numbers) continue;

    for (let i = 0; i < numbers.length; i++) {
      const val = parseFloat(numbers[i]);
      if (isNaN(val) || !isFinite(val)) return false;
      // Coordinates should be in sensible range for a 24x24 canvas [-3, 27]
      if (val < -3 || val > 27) return false;

      if (i % 2 === 0) {
        if (val < minX) minX = val;
        if (val > maxX) maxX = val;
      } else {
        if (val < minY) minY = val;
        if (val > maxY) maxY = val;
      }
      coordCount++;
    }
  }

  // Must have coordinates and reasonable non-zero dimensions
  if (coordCount < 4) return false;
  const width = maxX - minX;
  const height = maxY - minY;
  if (width < 2.5 || height < 2.5) return false;

  return true;
}

export function validateGeometry(value: unknown): value is IconGeometry {
  if (!value || typeof value !== "object" || forbiddenMarkup.test(JSON.stringify(value))) return false;
  const geometry = value as Partial<IconGeometry>;
  const isValidBasic = geometry.canvas === 24
    && typeof geometry.strokeWidth === "number" && geometry.strokeWidth >= 0.5 && geometry.strokeWidth <= 4
    && ["round", "square", "butt"].includes(geometry.strokeLinecap ?? "")
    && ["round", "miter", "bevel"].includes(geometry.strokeLinejoin ?? "")
    && ["none", "currentColor"].includes(geometry.fill ?? "")
    && Array.isArray(geometry.paths) && geometry.paths.length > 0 && geometry.paths.length <= 12
    && geometry.paths.every((path) => path && isValidPathData(typeof path === "string" ? path : path.d));

  if (!isValidBasic) return false;
  return hasValidCoordinateBounds(geometry as IconGeometry);
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
  return !existing.some((e) => getGeometryFingerprint(e) === candidateFp);
}

function styleValues(request: GenerationRequest, geometry: IconGeometry) {
  const style = request.lockedStyle?.fillMode ?? request.style;
  return {
    style,
    stroke: request.lockedStyle?.stroke ?? request.stroke,
    canvas: request.lockedStyle?.canvas ?? request.canvas,
    fill: style === "Solid" ? "currentColor" : geometry.fill,
    opacity: style === "Duotone" ? 0.16 : 1,
  };
}

export function geometryToSvg(geometry: IconGeometry, request: GenerationRequest): string {
  const values = styleValues(request, geometry);
  const paths = geometry.paths.map((p) => `<path d="${typeof p === "string" ? p : p.d}"/>`).join("");
  const body = values.style === "Duotone"
    ? `<g opacity="${values.opacity}" fill="currentColor">${paths}</g><g>${paths}</g>`
    : `<g>${paths}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${values.canvas} ${values.canvas}" fill="${values.fill}" stroke="currentColor" stroke-width="${values.stroke}" stroke-linecap="${geometry.strokeLinecap}" stroke-linejoin="${geometry.strokeLinejoin}">${body}</svg>`;
}

export function geometryCandidates(geometries: IconGeometry[], request: GenerationRequest, prompt: string): IconCandidate[] {
  const baseName = prompt.trim().replace(/\s+/g, " ").slice(0, 48) || "Generated icon";
  return geometries.slice(0, 6).map((geometry, index) => {
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

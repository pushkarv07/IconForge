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

export function validateGeometry(value: unknown): value is IconGeometry {
  if (!value || typeof value !== "object" || forbiddenMarkup.test(JSON.stringify(value))) return false;
  const geometry = value as Partial<IconGeometry>;
  return geometry.canvas === 24
    && typeof geometry.strokeWidth === "number" && geometry.strokeWidth >= 0.5 && geometry.strokeWidth <= 4
    && ["round", "square", "butt"].includes(geometry.strokeLinecap ?? "")
    && ["round", "miter", "bevel"].includes(geometry.strokeLinejoin ?? "")
    && ["none", "currentColor"].includes(geometry.fill ?? "")
    && Array.isArray(geometry.paths) && geometry.paths.length > 0 && geometry.paths.length <= 12
    && geometry.paths.every((path) => path && isValidPathData(typeof path === "string" ? path : path.d));
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

export function geometryToSvg(geometry: IconGeometry, request: GenerationRequest, variant: number): string {
  const values = styleValues(request, geometry);
  const transform = variant % 3 === 1 ? "translate(.2 .2) scale(.985)" : variant % 3 === 2 ? "translate(-.2 .1) scale(.99)" : "";
  const paths = geometry.paths.map((p) => `<path d="${typeof p === "string" ? p : p.d}"/>`).join("");
  const body = values.style === "Duotone" ? `<g opacity="${values.opacity}" fill="currentColor">${paths}</g><g>${paths}</g>` : `<g transform="${transform}">${paths}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${values.canvas} ${values.canvas}" fill="${values.fill}" stroke="currentColor" stroke-width="${values.stroke}" stroke-linecap="${geometry.strokeLinecap}" stroke-linejoin="${geometry.strokeLinejoin}">${body}</svg>`;
}

export function geometryCandidates(geometries: IconGeometry[], request: GenerationRequest, prompt: string): IconCandidate[] {
  const baseName = prompt.trim().replace(/\s+/g, " ").slice(0, 48) || "Generated icon";
  return geometries.slice(0, 6).map((geometry, index) => {
    const svg = geometryToSvg(geometry, request, index);
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

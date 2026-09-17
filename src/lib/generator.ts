import { iconLabels, iconPaths } from "./icons";
import type { GenerationRequest, IconCandidate, IconName, StyleProfile } from "./types";

export interface IconGenerator { generateIcons(request: GenerationRequest): IconCandidate[]; }

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "icon";

const conceptRules: { name: IconName; terms: string[] }[] = [
  { name: "camera", terms: ["video camera", "webcam", "camera"] },
  { name: "phone", terms: ["smartphone", "mobile phone", "cell phone", "telephone", "handset", "phone"] },
  { name: "location", terms: ["location pin", "map pin", "pin drop", "location", "pin"] },
  { name: "video", terms: ["video", "camcorder", "recording"] },
  { name: "microphone", terms: ["microphone", "mic", "audio"] },
  { name: "laptop", terms: ["laptop", "notebook computer", "notebook"] },
  { name: "monitor", terms: ["monitor", "desktop screen", "computer screen"] },
  { name: "map", terms: ["map", "atlas", "navigation"] },
  { name: "clock", terms: ["clock", "timer", "time"] },
  { name: "coffee", terms: ["coffee cup", "coffee", "cup"] },
  { name: "shopping-cart", terms: ["shopping cart", "cart", "trolley"] },
  { name: "cloud-upload", terms: ["cloud upload", "upload to cloud", "cloud storage"] },
  { name: "search", terms: ["search", "magnifying glass", "magnifier", "find", "lookup", "explore"] },
  ...(["home", "calendar", "settings", "bell", "user", "mail", "heart", "wallet", "check", "close", "menu", "star", "bookmark", "filter", "download", "upload", "card", "chart", "bank", "receipt"] as IconName[]).map((name) => ({ name, terms: [name] })),
];

const searchVariants = [
  '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
  '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 3.5 3.5a1.2 1.2 0 1 0 1.7-1.7L17.7 14.3"/>',
  '<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4.5 4.5"/>',
  '<rect x="4.5" y="4.5" width="12" height="12" rx="3.5"/><path d="m15 15 5.5 5.5"/>',
  '<circle cx="10" cy="10" r="5.5"/><path d="m14.2 14.2 6.3 6.3"/>',
  '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/><path d="M8 8a3.5 3.5 0 0 1 4 0"/>',
];

function resolveConcept(prompt: string): IconName | null {
  const normalized = prompt.toLowerCase().replace(/[\-_]+/g, " ").replace(/\s+/g, " ").trim();
  return conceptRules.find((rule) => rule.terms.some((term) => normalized === term || normalized.includes(term)))?.name ?? null;
}

function variationDetail(name: IconName, variant: number): string {
  if (variant === 0) return "";
  const details: Partial<Record<IconName, string[]>> = {
    phone: ["<path d=\"M8 4h8\"/>", "<path d=\"M8 20h8\"/>", "<circle cx=\"12\" cy=\"18\" r=\".7\" fill=\"currentColor\" stroke=\"none\"/>", "<path d=\"M9 5h6\"/>", "<path d=\"M7 6h10\"/>",],
    laptop: ["<path d=\"M8 8h8M8 11h5\"/>", "<circle cx=\"12\" cy=\"10\" r=\"1\"/>",],
    camera: ["<circle cx=\"12\" cy=\"13\" r=\"1\"/>", "<path d=\"M6 10h2\"/>",],
    video: ["<path d=\"m7 12 4 2.5v-5L7 12Z\"/>",],
    location: ["<circle cx=\"12\" cy=\"10\" r=\"1\" fill=\"currentColor\" stroke=\"none\"/>", "<path d=\"M9 17h6\"/>", "<circle cx=\"12\" cy=\"10\" r=\"4\"/>", "<path d=\"M7 14h2\"/>", "<path d=\"M15 14h2\"/>",],
    map: ["<path d=\"M5 7h2M11 5h2M17 7h2\"/>", "<circle cx=\"12\" cy=\"12\" r=\"1\"/>", "<path d=\"M5 17h2M17 17h2\"/>", "<path d=\"M8 9h2\"/>", "<path d=\"M14 15h2\"/>",],
    clock: ["<path d=\"M12 5v2\"/>", "<path d=\"M19 12h-2\"/>", "<path d=\"M12 17v2\"/>", "<path d=\"M7 12H5\"/>", "<circle cx=\"12\" cy=\"12\" r=\"1\" fill=\"currentColor\" stroke=\"none\"/>",],
  };
  const options = details[name];
  return options?.[(variant - 1) % options.length] ?? (variant % 2 === 0 ? "<circle cx=\"12\" cy=\"12\" r=\".7\" fill=\"currentColor\" stroke=\"none\"/>" : "<path d=\"M7 7h10\"/>");
}

function makeSvg(name: IconName, request: GenerationRequest, variant: number): string {
  const style = request.lockedStyle?.fillMode ?? request.style;
  const stroke = request.lockedStyle?.stroke ?? request.stroke;
  const cap = request.lockedStyle?.cap.toLowerCase() ?? "round";
  const join = request.lockedStyle?.join.toLowerCase() ?? "round";
  const fill = style === "Solid" ? "currentColor" : "none";
  const opacity = style === "Duotone" ? 0.14 : 1;
  const paths = name === "search" ? (searchVariants[variant % searchVariants.length] ?? iconPaths[name]) : iconPaths[name];
  const extra = name === "calendar" && request.prompt.toLowerCase().includes("notification") ? '<circle cx="18" cy="6" r="3" fill="currentColor" stroke="none"/><path d="M18 5v2m-1 0h2" stroke="white" stroke-width=".8"/>' : "";
  const detail = name === "search" ? "" : variationDetail(name, variant);
  const transform = name === "search" ? "" : variant % 3 === 1 ? "translate(.25 .25) scale(.98)" : variant % 3 === 2 ? "translate(-.2 .2) scale(.985)" : "";
  const body = style === "Duotone" ? `<g opacity="${opacity}" fill="currentColor">${paths.replaceAll("fill=\"none\"", "")}</g>${paths}${detail}` : transform ? `<g transform="${transform}">${paths}${detail}</g>` : `${paths}${detail}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="${cap}" stroke-linejoin="${join}">${body}${extra}</svg>`;
}

export class MockGenerator implements IconGenerator {
  generateIcons(request: GenerationRequest): IconCandidate[] {
    const preferred = resolveConcept(request.prompt);
    const concept = preferred ?? "generic";
    return Array.from({ length: 6 }, (_, index) => {
      const svg = makeSvg(concept, request, index);
      return {
      id: `${slug(iconLabels[concept])}-${request.style.toLowerCase()}-${index}`,
      name: iconLabels[concept],
      label: index === 0 ? "Best match" : `Variation ${index}`,
      svg,
      canvas: request.lockedStyle?.canvas ?? request.canvas,
      stroke: request.lockedStyle?.stroke ?? request.stroke,
      style: request.lockedStyle?.fillMode ?? request.style,
      complexity: request.lockedStyle?.complexity ?? request.complexity,
      pathCount: (svg.match(/<(?:path|circle|rect)/g) ?? []).length,
      weight: (request.lockedStyle?.weight ?? 42) + (index % 3) * 3,
      };
    });
  }
}

export function styleFromIcon(icon: IconCandidate, _request: GenerationRequest): StyleProfile {
  void _request;
  const cap = "Rounded" as const;
  const join = "Rounded" as const;
  const density = icon.complexity === "Detailed" ? "Dense" as const : icon.complexity === "Simple" ? "Airy" as const : "Balanced" as const;
  const geometric = icon.pathCount >= 4 ? "Geometric" as const : "Mixed" as const;
  return { name: `${icon.name} style`, canvas: icon.canvas, stroke: icon.stroke as 1 | 1.5 | 2, strokeWidth: icon.stroke as 1 | 1.5 | 2, cap, strokeLinecap: cap, join, strokeLinejoin: join, fillMode: icon.style, complexity: icon.complexity, density, corner: "Soft", weight: icon.weight, opticalWeight: icon.weight, geometric };
}

export const mockGenerator = new MockGenerator();
export { makeSvg };

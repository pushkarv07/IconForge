import type { IconCandidate, StyleProfile } from "./types";

export interface ConsistencyFinding {
  iconId?: string;
  iconName?: string;
  message: string;
  status: "good" | "warn";
  mismatch: boolean;
  reasons?: string[];
}

export interface ConsistencyResult {
  score: number;
  checks: { label: string; result: string; status: "good" | "warn" }[];
  findings: ConsistencyFinding[];
}

function normalizeCapOrJoin(val: string): string {
  const v = val.toLowerCase();
  if (v.includes("round")) return "Rounded";
  if (v.includes("square")) return "Square";
  if (v.includes("butt")) return "Butt";
  if (v.includes("miter")) return "Miter";
  if (v.includes("bevel")) return "Bevel";
  return val.charAt(0).toUpperCase() + val.slice(1);
}

function extractSvgAttribute(svg: string, attr: string): string | null {
  const match = svg.match(new RegExp(`${attr}="([^"]+)"`, "i"));
  return match ? match[1] : null;
}

function modeOf<T>(arr: T[], defaultVal: T): T {
  if (!arr.length) return defaultVal;
  const counts = new Map<T, number>();
  for (const item of arr) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  let best = defaultVal;
  let maxCount = -1;
  for (const [val, count] of counts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      best = val;
    }
  }
  return best;
}

const complexityRank: Record<string, number> = {
  Simple: 1,
  Balanced: 2,
  Detailed: 3,
};

export function consistencyScore(
  icons: IconCandidate[],
  referenceProfile?: StyleProfile
): ConsistencyResult {
  if (!icons.length) return { score: 0, checks: [], findings: [] };

  const expectedCanvas = referenceProfile
    ? referenceProfile.canvas
    : modeOf(icons.map((i) => i.canvas), icons[0]?.canvas ?? 24);

  const expectedStroke = referenceProfile
    ? Number(referenceProfile.stroke ?? referenceProfile.strokeWidth ?? 1.5)
    : modeOf(icons.map((i) => Number(i.stroke)), Number(icons[0]?.stroke ?? 1.5));

  const expectedFill = referenceProfile
    ? referenceProfile.fillMode
    : modeOf(icons.map((i) => i.style), icons[0]?.style ?? "Outline");

  const expectedCap = normalizeCapOrJoin(
    referenceProfile
      ? (referenceProfile.cap ?? referenceProfile.strokeLinecap ?? "Rounded")
      : "Rounded"
  );

  const expectedJoin = normalizeCapOrJoin(
    referenceProfile
      ? (referenceProfile.join ?? referenceProfile.strokeLinejoin ?? "Rounded")
      : "Rounded"
  );

  const expectedComplexity = referenceProfile
    ? (referenceProfile.complexity ?? "Simple")
    : modeOf(icons.map((i) => i.complexity), "Simple");

  const expectedWeight = referenceProfile
    ? (referenceProfile.weight ?? referenceProfile.opticalWeight ?? 42)
    : 42;

  const findings: ConsistencyFinding[] = icons.map((icon) => {
    const reasons: string[] = [];

    // 1. Stroke check
    if (Math.abs(Number(icon.stroke) - expectedStroke) > 0.01) {
      reasons.push(`Stroke: ${icon.stroke}px vs expected ${expectedStroke}px`);
    }

    // 2. Canvas check
    if (icon.canvas !== expectedCanvas) {
      reasons.push(
        `Canvas mismatch: ${icon.canvas}×${icon.canvas} vs expected ${expectedCanvas}×${expectedCanvas}`
      );
    }

    // 3. Fill mode check
    if (icon.style && expectedFill && icon.style.toLowerCase() !== expectedFill.toLowerCase()) {
      reasons.push(`Fill mode mismatch: ${icon.style} vs expected ${expectedFill}`);
    }

    // 4. Cap check from SVG markup
    const rawCap = extractSvgAttribute(icon.svg, "stroke-linecap");
    if (rawCap) {
      const iconCap = normalizeCapOrJoin(rawCap);
      if (iconCap !== expectedCap) {
        reasons.push(`Cap mismatch: ${iconCap} vs expected ${expectedCap}`);
      }
    }

    // 5. Join check from SVG markup
    const rawJoin = extractSvgAttribute(icon.svg, "stroke-linejoin");
    if (rawJoin) {
      const iconJoin = normalizeCapOrJoin(rawJoin);
      if (iconJoin !== expectedJoin) {
        reasons.push(`Join mismatch: ${iconJoin} vs expected ${expectedJoin}`);
      }
    }

    // 6. Path complexity check
    const iconRank = complexityRank[icon.complexity] ?? 1;
    const refRank = complexityRank[expectedComplexity] ?? 1;
    if (iconRank > refRank || (expectedComplexity === "Simple" && icon.pathCount > 10)) {
      reasons.push("Path complexity: higher than reference");
    } else if (icon.complexity && icon.complexity !== expectedComplexity) {
      reasons.push(`Path complexity mismatch: ${icon.complexity} vs expected ${expectedComplexity}`);
    }

    const hasMismatch = reasons.length > 0;
    return {
      iconId: icon.id,
      iconName: icon.name,
      message: hasMismatch ? `${icon.name}: ${reasons.join("; ")}` : `${icon.name} matches reference style.`,
      status: hasMismatch ? "warn" : "good",
      mismatch: hasMismatch,
      reasons,
    };
  });

  const allStrokesMatch = icons.every(
    (icon) => Math.abs(Number(icon.stroke) - expectedStroke) <= 0.01
  );
  const allCanvasesMatch = icons.every((icon) => icon.canvas === expectedCanvas);
  const allStylesMatch = icons.every(
    (icon) =>
      !icon.style ||
      !expectedFill ||
      icon.style.toLowerCase() === expectedFill.toLowerCase()
  );
  const allCapsMatch = !findings.some((f) => f.reasons?.some((r) => r.startsWith("Cap mismatch")));
  const allJoinsMatch = !findings.some((f) => f.reasons?.some((r) => r.startsWith("Join mismatch")));
  const allComplexityMatch = !findings.some((f) => f.reasons?.some((r) => r.startsWith("Path complexity")));
  const allWeightsMatch = icons.every((icon) => Math.abs(icon.weight - expectedWeight) <= 8);

  const checks = [
    {
      label: "Canvas",
      result: allCanvasesMatch ? `${expectedCanvas} × ${expectedCanvas}` : "Canvas sizes vary",
      status: allCanvasesMatch ? ("good" as const) : ("warn" as const),
    },
    {
      label: "Stroke",
      result: allStrokesMatch ? `${expectedStroke} px` : "Stroke weights vary",
      status: allStrokesMatch ? ("good" as const) : ("warn" as const),
    },
    {
      label: "Line cap",
      result: allCapsMatch ? expectedCap : "Caps vary",
      status: allCapsMatch ? ("good" as const) : ("warn" as const),
    },
    {
      label: "Line join",
      result: allJoinsMatch ? expectedJoin : "Joins vary",
      status: allJoinsMatch ? ("good" as const) : ("warn" as const),
    },
    {
      label: "Fill mode",
      result: allStylesMatch ? expectedFill : "Mixed styles",
      status: allStylesMatch ? ("good" as const) : ("warn" as const),
    },
    {
      label: "Path complexity",
      result: allComplexityMatch ? "Balanced" : "Complexity varies",
      status: allComplexityMatch ? ("good" as const) : ("warn" as const),
    },
    {
      label: "Visual weight",
      result: allWeightsMatch ? "Balanced" : "Weight varies",
      status: allWeightsMatch ? ("good" as const) : ("warn" as const),
    },
  ];

  const mismatchedCount = findings.filter((f) => f.mismatch).length;
  let score = 100;
  if (mismatchedCount > 0) {
    const checksGoodRatio = checks.filter((c) => c.status === "good").length / checks.length;
    const iconsGoodRatio = (icons.length - mismatchedCount) / icons.length;
    score = Math.max(0, Math.min(98, Math.round((0.5 * checksGoodRatio + 0.5 * iconsGoodRatio) * 100)));
  }

  return { score, checks, findings };
}

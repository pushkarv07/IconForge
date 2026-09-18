import { NextResponse } from "next/server";
import {
  geometryCandidates,
  validateGeometry,
  isDistinctGeometry,
  sortAndSelectBestMatch,
  type IconGeometry,
} from "@/lib/geometry";
import type { GenerationRequest } from "@/lib/types";

export const runtime = "nodejs";

const model = "gemini-3.5-flash-lite";

function promptFor(
  request: GenerationRequest,
  targetCount: number = 6,
  existingCount: number = 0
): string {
  const locked = request.lockedStyle;
  const reference = request.styleReference;
  const askCount = Math.max(targetCount, 6);
  const distinctNote =
    existingCount > 0
      ? `\nImportant: You already produced ${existingCount} candidates. Return ${targetCount} NEW, distinct variations that differ in visual silhouette and geometry from previous ones.`
      : "";

  return `You are a world-class iconographer and vector designer creating production-grade UI icons for a clean design system.
Generate ${askCount} distinct, high-quality vector icon variations for the concept: "${request.prompt}".

PRIORITIZE QUALITY AND SEMANTIC ACCURACY OVER RAW CANDIDATE COUNT.
Return ONLY valid JSON matching this exact shape: {"candidates":[{"canvas":24,"strokeWidth":1.5,"strokeLinecap":"round","strokeLinejoin":"round","fill":"none","paths":[{"d":"M..."}]}]}

CORE REQUIREMENTS:
1. SEMANTIC ACCURACY: Every candidate MUST immediately and unmistakably represent the requested concept ("${request.prompt}") at a glance.
   - "coffee cup with steam" / "coffee": MUST depict an identifiable cup/mug with a handle and visible wavy steam wisps rising above it. Do NOT generate bowls, buckets, or abstract symbols.
   - "search": MUST depict an identifiable magnifying glass with a round circular lens and a diagonal/straight handle. Do NOT generate a plain circle or unrelated shapes.
   - "cloud upload": MUST depict a clean cloud outline with an upward-pointing arrow inside or at the base.
   - "shopping cart": MUST depict a wheeled cart basket with push handle and bottom wheels.
   - "camera": MUST depict a horizontal camera body with rounded corners and a central circular lens.
   - "location": MUST depict a map pin/marker with a pointed tip at the bottom and rounded top.
   - "design": MUST depict an iconic tool like a vector pen tool with bezier anchor, an artboard/ruler, or an artist palette.
   - For any other prompt: Use universally recognized UI iconography for that concept. Never output abstract shapes, disconnected lines, or meaningless doodles.

2. OPTIMIZED FOR 24 × 24 CANVAS:
   - Canvas size is 24x24.
   - Keep the icon artwork comfortably padded within the grid: coordinates should sit between 2 and 22.
   - Optical balance: center the icon mass around (12, 12).
   - High legibility at small sizes: clear silhouette, balanced negative space, no micro-details or cramped geometry.

3. CLEAN SVG GEOMETRY:
   - Valid SVG path commands: M, L, H, V, C, S, Q, T, A, Z.
   - Coordinates must be clean, sensible numbers between 1 and 23.
   - In arc 'A' or 'a' commands, separate all 7 parameters with spaces (e.g. 'a 4 4 0 0 0 1 2').
   - Keep each icon to 1 to 6 clean, purposeful paths. No orphan dots, no overlapping duplicate lines.

4. MEANINGFUL VARIATION BETWEEN CANDIDATES:
   - Provide genuine design alternatives (e.g. different silhouettes, corner radiuses, proportions, compactness, or structural styles).
   - Do not return near-duplicate copies or tiny 0.1px offsets.

5. REQUESTED SPECIFICATIONS:
   - Style: ${request.style}; stroke width: ${request.stroke}; complexity: ${request.complexity}; color mode: ${request.color}.${distinctNote}
${
  locked
    ? `
STYLE LOCK IS ACTIVE. Strictly preserve the visual language of the reference icon:
- Stroke weight: ${locked.strokeWidth}px
- Caps: ${locked.strokeLinecap}, Joins: ${locked.strokeLinejoin}
- Fill: ${locked.fillMode}
- Visual density: ${locked.density}, Complexity: ${locked.complexity}
- Corner radius character: ${locked.corner.toLowerCase()}
Change the concept subject to "${request.prompt}", but keep the exact design system styling.`
    : ""
}
${
  reference
    ? `Reference SVG characteristics: ${JSON.stringify({
        pathCount: reference.pathCount,
        viewBox: reference.viewBox,
        svg: reference.svg.slice(0, 2400),
      })}`
    : ""
}`;
}

async function fetchGeminiCandidates(
  requestBody: GenerationRequest,
  targetCount: number,
  existingCount: number
): Promise<IconGeometry[]> {
  const prompt = promptFor(requestBody, targetCount, existingCount);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
      process.env.GEMINI_API_KEY!
    )}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.5,
        },
      }),
    }
  );

  if (!response.ok) {
    const upstream = await response.text();
    console.error("Gemini upstream request failed", {
      status: response.status,
      body: upstream.slice(0, 500),
    });
    if (response.status === 429) {
      const err = new Error("Gemini quota or rate limit reached.");
      (err as unknown as { code: string }).code = "quota";
      throw err;
    }
    throw new Error(`Gemini request failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return [];

  try {
    const parsed = JSON.parse(text) as { candidates?: unknown[] };
    const rawList = parsed.candidates ?? [];
    const valid: IconGeometry[] = [];

    for (const item of rawList) {
      if (!item || typeof item !== "object") continue;
      const raw = item as {
        canvas?: number;
        strokeWidth?: number;
        strokeLinecap?: string;
        strokeLinejoin?: string;
        fill?: string;
        paths?: unknown[];
      };
      if (!Array.isArray(raw.paths)) continue;

      const geometry: IconGeometry = {
        canvas: raw.canvas ?? 24,
        strokeWidth: raw.strokeWidth ?? 1.5,
        strokeLinecap: (raw.strokeLinecap as "round" | "square" | "butt") ?? "round",
        strokeLinejoin: (raw.strokeLinejoin as "round" | "miter" | "bevel") ?? "round",
        fill: (raw.fill as "none" | "currentColor") ?? "none",
        paths: raw.paths.map((p) =>
          typeof p === "string"
            ? { d: p }
            : p && typeof p === "object" && "d" in p
            ? (p as { d: string })
            : { d: "" }
        ),
      };

      if (validateGeometry(geometry, requestBody.prompt)) {
        valid.push(geometry);
      }
    }

    return valid;
  } catch (err) {
    console.error("Failed to parse Gemini candidates JSON", err);
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerationRequest;
    if (!body.prompt?.trim()) {
      return NextResponse.json(
        { error: "Describe the icon you want to generate." },
        { status: 400 }
      );
    }
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Gemini is not configured yet. You can use Mock mode instead.",
        },
        { status: 503 }
      );
    }

    const TARGET = 6;
    const MAX_ATTEMPTS = 2;
    const collected: IconGeometry[] = [];

    for (let attempt = 1; attempt <= MAX_ATTEMPTS && collected.length < TARGET; attempt++) {
      const needed = TARGET - collected.length;
      try {
        const batch = await fetchGeminiCandidates(body, needed, collected.length);
        for (const geom of batch) {
          if (isDistinctGeometry(geom, collected)) {
            collected.push(geom);
            if (collected.length >= TARGET) break;
          }
        }
      } catch (err) {
        if ((err as { code?: string })?.code === "quota") {
          return NextResponse.json(
            { code: "quota", error: "Gemini quota or rate limit reached." },
            { status: 429 }
          );
        }
        if (attempt === 1 && collected.length === 0) {
          throw err;
        }
        // If second attempt fails, proceed with whatever we collected
        break;
      }
    }

    if (collected.length === 0) {
      throw new Error("Gemini returned invalid icon geometry");
    }

    // Rank candidates so the strongest, most balanced, semantically accurate candidate is Best match (index 0)
    const ranked = sortAndSelectBestMatch(collected.slice(0, TARGET), body.prompt);

    const finalCandidates = geometryCandidates(
      ranked,
      body,
      body.prompt
    );

    return NextResponse.json({ candidates: finalCandidates });
  } catch (error) {
    console.error("Gemini generation error", error);
    return NextResponse.json(
      { code: "upstream", error: "Gemini is temporarily unavailable." },
      { status: 502 }
    );
  }
}

import { NextResponse } from "next/server";
import {
  geometryCandidates,
  validateGeometry,
  getGeometryFingerprint,
  type IconGeometry,
} from "@/lib/geometry";
import type { GenerationRequest } from "@/lib/types";

export const runtime = "nodejs";

const model = "gemini-3.5-flash-lite";

function promptFor(
  request: GenerationRequest,
  targetCount: number = 6,
  existingCount: number = 0
) {
  const locked = request.lockedStyle;
  const reference = request.styleReference;
  const askCount = Math.max(targetCount, 6);
  const distinctNote =
    existingCount > 0
      ? `\nImportant: Generate ${targetCount} NEW, distinct variations that differ in geometry from previous candidates.`
      : "";

  return `You generate ${askCount} visually distinct icon variations for the concept: "${request.prompt}".

Return ONLY valid JSON matching this exact shape: {"candidates":[{"canvas":24,"strokeWidth":1.5,"strokeLinecap":"round","strokeLinejoin":"round","fill":"none","paths":[{"d":"M..."}]}]}

Rules:
- Return an array of ${askCount} to ${askCount + 2} candidates.
- Every candidate MUST immediately and clearly depict the requested concept ("${request.prompt}") using recognizable iconography.
  Examples: "search" must be an identifiable magnifying glass; "cloud upload" must be a cloud with an upload arrow; "shopping cart" must be a wheeled cart; "camera" must be an identifiable camera body with lens; "location" must be a map pin/marker; "coffee" must be an identifiable cup/mug with handle or steam.
- Do NOT generate abstract, ambiguous, broken, or unrelated shapes.
- The variations must be visibly distinct (variations in geometry, proportion, compactness, curvature, or detail).
- Each candidate canvas must be 24.
- Use only valid SVG path commands (M, L, H, V, C, S, Q, T, A, Z) and numeric coordinates between 1 and 23.
- In arc 'A' or 'a' commands, always separate all 7 parameters with spaces (e.g. 'a 4 4 0 0 0 1 2'), never glued together.
- Do not return SVG, HTML, XML, scripts, images, data URLs, explanations, or markdown.
- Keep each candidate to at most 12 paths and each path d under 1000 characters.
- Honor this requested style: ${request.style}; stroke width: ${request.stroke}; complexity: ${request.complexity}; color mode: ${request.color}.${distinctNote}
${
  locked
    ? `
STYLE LOCK IS ACTIVE. Preserve the visual language of the reference icon. Change the subject, not the design system.
Prioritize matching stroke weight (${locked.strokeWidth}px), caps (${locked.strokeLinecap}), joins (${locked.strokeLinejoin}), fill (${locked.fillMode}), visual density (${locked.density}), complexity (${locked.complexity}), geometric character (${locked.geometric}), optical weight (${locked.opticalWeight}), spacing, and ${locked.corner.toLowerCase()} corner behavior. Do not simply regenerate the reference icon with a different label.`
    : ""
}
${
  reference
    ? `
Compact reference characteristics: ${JSON.stringify({
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

      if (validateGeometry(geometry)) {
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
    const seenFingerprints = new Set<string>();

    for (let attempt = 1; attempt <= MAX_ATTEMPTS && collected.length < TARGET; attempt++) {
      const needed = TARGET - collected.length;
      try {
        const batch = await fetchGeminiCandidates(body, needed, collected.length);
        for (const geom of batch) {
          const fp = getGeometryFingerprint(geom);
          if (!seenFingerprints.has(fp)) {
            seenFingerprints.add(fp);
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

    const finalCandidates = geometryCandidates(
      collected.slice(0, TARGET),
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

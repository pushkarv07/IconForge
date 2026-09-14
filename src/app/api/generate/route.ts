import { NextResponse } from "next/server";
import { geometryCandidates, validateGeometry, type IconGeometry } from "@/lib/geometry";
import type { GenerationRequest } from "@/lib/types";

export const runtime = "nodejs";

const model = "gemini-3.5-flash-lite";

function promptFor(request: GenerationRequest) {
  const locked = request.lockedStyle;
  const reference = request.styleReference;
  return `You generate six visually related icon variations for: ${request.prompt}

Return ONLY valid JSON matching this exact shape: {"candidates":[{"canvas":24,"strokeWidth":1.5,"strokeLinecap":"round","strokeLinejoin":"round","fill":"none","paths":[{"d":"M..."}]}]}

Rules:
- Return 4 to 6 candidates. Every candidate must depict the requested concept, not a generic icon.
- Each candidate canvas must be 24. Use only SVG path d geometry in paths.
- Use valid SVG path commands (M, L, H, V, C, S, Q, T, A, Z) and numeric coordinates in the 0 to 24 viewBox.
- In arc 'A' or 'a' commands, always separate all 7 parameters with spaces (e.g. 'a 4 4 0 0 0 1 2'), never glued together.
- Do not return SVG, HTML, XML, scripts, images, data URLs, explanations, or markdown.
- Keep each candidate to at most 12 paths and each path d under 1000 characters.
- Honor this requested style: ${request.style}; stroke width: ${request.stroke}; complexity: ${request.complexity}; color mode: ${request.color}.
${locked ? `
STYLE LOCK IS ACTIVE. Preserve the visual language of the reference icon. Change the subject, not the design system.
Prioritize matching stroke weight (${locked.strokeWidth}px), caps (${locked.strokeLinecap}), joins (${locked.strokeLinejoin}), fill (${locked.fillMode}), visual density (${locked.density}), complexity (${locked.complexity}), geometric character (${locked.geometric}), optical weight (${locked.opticalWeight}), spacing, and ${locked.corner.toLowerCase()} corner behavior. Do not simply regenerate the reference icon with a different label.` : ""}
${reference ? `
Compact reference characteristics: ${JSON.stringify({ pathCount: reference.pathCount, viewBox: reference.viewBox, svg: reference.svg.slice(0, 2400) })}` : ""}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as GenerationRequest;
    if (!body.prompt?.trim()) return NextResponse.json({ error: "Describe the icon you want to generate." }, { status: 400 });
    if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "Gemini is not configured yet. You can use Mock mode instead." }, { status: 503 });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: promptFor(body) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              candidates: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    canvas: { type: "INTEGER" },
                    strokeWidth: { type: "NUMBER" },
                    strokeLinecap: { type: "STRING", enum: ["round", "square", "butt"] },
                    strokeLinejoin: { type: "STRING", enum: ["round", "miter", "bevel"] },
                    fill: { type: "STRING", enum: ["none", "currentColor"] },
                    paths: {
                      type: "ARRAY",
                      items: {
                        type: "OBJECT",
                        properties: {
                          d: { type: "STRING" }
                        },
                        required: ["d"]
                      }
                    }
                  },
                  required: ["canvas", "strokeWidth", "strokeLinecap", "strokeLinejoin", "fill", "paths"]
                }
              }
            },
            required: ["candidates"]
          },
          temperature: 0.45
        },
      }),
    });
    if (!response.ok) {
      const upstream = await response.text();
      console.error("Gemini upstream request failed", { status: response.status, body: upstream.slice(0, 500) });
      if (response.status === 429) return NextResponse.json({ code: "quota", error: "Gemini quota or rate limit reached." }, { status: 429 });
      throw new Error(`Gemini request failed with ${response.status}`);
    }
    const payload = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned an empty response");
    const parsed = JSON.parse(text) as { candidates?: unknown[] };
    const geometries = parsed.candidates ?? [];
    const valid = geometries
      .map((g) => {
        if (!g || typeof g !== "object") return null;
        const raw = g as { paths?: unknown[] };
        if (!Array.isArray(raw.paths)) return null;
        return {
          ...g,
          paths: raw.paths.map((p) => (typeof p === "string" ? { d: p } : p && typeof p === "object" && "d" in p ? p : { d: "" })),
        } as IconGeometry;
      })
      .filter((g): g is IconGeometry => Boolean(g && validateGeometry(g)));

    if (valid.length < 3) throw new Error("Gemini returned invalid icon geometry");
    return NextResponse.json({ candidates: geometryCandidates(valid.slice(0, 6), body, body.prompt) });
  } catch (error) {
    console.error("Gemini generation error", error);
    return NextResponse.json({ code: "upstream", error: "Gemini is temporarily unavailable." }, { status: 502 });
  }
}

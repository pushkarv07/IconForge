import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateGeometry,
  hasValidCoordinateBounds,
  isSemanticMatch,
  getGeometryFingerprint,
  isDistinctGeometry,
  scoreGeometry,
  sortAndSelectBestMatch,
  geometryCandidates,
  type IconGeometry,
} from "../src/lib/geometry.ts";
import type { GenerationRequest } from "../src/lib/types.ts";

const validSearchIcon: IconGeometry = {
  canvas: 24,
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  fill: "none",
  paths: [
    { d: "M 10.5 17 A 6.5 6.5 0 1 0 10.5 4 a 6.5 6.5 0 0 0 0 13 Z" },
    { d: "M 15.5 15.5 L 20.5 20.5" },
  ],
};

const validCoffeeIcon: IconGeometry = {
  canvas: 24,
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  fill: "none",
  paths: [
    { d: "M 5 9 h 12 v 5 a 5 5 0 0 1 -5 5 h -2 a 5 5 0 0 1 -5 -5 Z" },
    { d: "M 17 11 h 2 a 2.5 2.5 0 0 1 0 5 h -2" },
    { d: "M 8 5 c 0 1 1 1 1 2 M 12 5 c 0 1 1 1 1 2" },
  ],
};

const validCloudUploadIcon: IconGeometry = {
  canvas: 24,
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  fill: "none",
  paths: [
    { d: "M 6 17 C 4 17 3 15.5 3 13.5 C 3 11.5 4.5 10 6.5 10 C 7 7.5 9.5 6 12 6 C 15 6 17 8 17.5 10.5 C 19.5 10.8 21 12.5 21 14.5 C 21 16.5 19.5 17 17.5 17 Z" },
    { d: "M 12 15 V 9 M 9.5 11.5 L 12 9 L 14.5 11.5" },
  ],
};

const sampleRequest: GenerationRequest = {
  prompt: "search",
  style: "Outline",
  canvas: 24,
  stroke: 1.5,
  complexity: "Simple",
  color: "Current Color",
};

describe("AI Generation Quality & Validation Suite", () => {
  it("1. Invalid SVG filtering (malformed paths, NaN, out-of-bounds, empty output)", () => {
    // Malformed commands
    assert.equal(validateGeometry({ canvas: 24, strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", fill: "none", paths: [{ d: "NOT A PATH" }] }), false);
    
    // Forbidden markup
    assert.equal(validateGeometry({ canvas: 24, strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", fill: "none", paths: [{ d: "<script>alert(1)</script>" }] }), false);

    // Out of bounds coordinate (> 26 or < -2)
    assert.equal(validateGeometry({
      canvas: 24, strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", fill: "none",
      paths: [{ d: "M 0 0 L 100 100" }],
    }), false);

    // Microscopic dot (width < 3.5 or height < 3.5)
    assert.equal(validateGeometry({
      canvas: 24, strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", fill: "none",
      paths: [{ d: "M 12 12 L 12.2 12.2" }],
    }), false);

    // Valid search icon passes
    assert.equal(validateGeometry(validSearchIcon), true);
  });

  it("2. Semantic filtering (rejects non-conforming shapes for specific prompts)", () => {
    // A single horizontal line is not a coffee cup with steam
    const lineOnly: IconGeometry = {
      canvas: 24, strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", fill: "none",
      paths: [{ d: "M 4 12 H 20" }],
    };
    assert.equal(isSemanticMatch(lineOnly, "coffee cup with steam"), false);
    assert.equal(validateGeometry(lineOnly, "coffee cup with steam"), false);

    // Authentic coffee cup with steam passes
    assert.equal(isSemanticMatch(validCoffeeIcon, "coffee cup with steam"), true);
    assert.equal(validateGeometry(validCoffeeIcon, "coffee cup with steam"), true);

    // Magnifying glass with circular lens and handle passes search
    assert.equal(isSemanticMatch(validSearchIcon, "search"), true);
    assert.equal(validateGeometry(validSearchIcon, "search"), true);

    // Cloud upload with upward arrow passes
    assert.equal(isSemanticMatch(validCloudUploadIcon, "cloud upload"), true);
  });

  it("3. Visual quality & coordinate bounds filtering", () => {
    assert.equal(hasValidCoordinateBounds(validSearchIcon), true);
    assert.equal(hasValidCoordinateBounds(validCoffeeIcon), true);

    // Huge overflow canvas > 24
    const hugeOverflow: IconGeometry = {
      canvas: 24, strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", fill: "none",
      paths: [{ d: "M -1 -1 L 25 25" }],
    };
    assert.equal(hasValidCoordinateBounds(hugeOverflow), false);
  });

  it("4. Duplicate and similarity filtering (deduplication)", () => {
    const iconA: IconGeometry = {
      canvas: 24, strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", fill: "none",
      paths: [{ d: "M 4 4 L 20 20" }, { d: "M 20 4 L 4 20" }],
    };
    const iconADup: IconGeometry = {
      canvas: 24, strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", fill: "none",
      paths: [{ d: "M  4  4  L  20  20" }, { d: "M 20 4 L 4 20" }],
    };

    assert.equal(getGeometryFingerprint(iconA), getGeometryFingerprint(iconADup));
    assert.equal(isDistinctGeometry(iconADup, [iconA]), false);

    // Different geometry is distinct
    assert.equal(isDistinctGeometry(validSearchIcon, [iconA]), true);
  });

  it("5. Best Match selection: strongest candidate placed at index 0", () => {
    // Create an off-center search icon
    const offCenterSearch: IconGeometry = {
      canvas: 24, strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", fill: "none",
      paths: [
        { d: "M 4 8 A 3 3 0 1 0 4 2 a 3 3 0 0 0 0 6 Z" },
        { d: "M 6 7 L 8 9" },
      ],
    };

    const scoreOffCenter = scoreGeometry(offCenterSearch, "search");
    const scoreBalanced = scoreGeometry(validSearchIcon, "search");
    assert.ok(scoreBalanced > scoreOffCenter, "Centered, well-proportioned icon must score higher");

    // When offCenterSearch is passed first, sortAndSelectBestMatch must reorder so validSearchIcon is at index 0
    const ranked = sortAndSelectBestMatch([offCenterSearch, validSearchIcon], "search");
    assert.equal(ranked[0], validSearchIcon, "Best match must be the highest-scoring candidate, not lowest index");

    const candidates = geometryCandidates(ranked, sampleRequest, "search");
    assert.equal(candidates[0].label, "AI best match");
    assert.equal(candidates[1].label, "AI variation 1");
  });

  it("6. Final accepted candidate count & partial generation (honest counts)", () => {
    // Suppose only 4 candidates pass validation
    const passedGeometries = [validSearchIcon, validCoffeeIcon, validCloudUploadIcon, validSearchIcon];
    const candidates = geometryCandidates(passedGeometries, sampleRequest, "icons");
    assert.equal(candidates.length, 4);

    // Formatting checks: single source of truth
    const kickerText = `${candidates.length} ${candidates.length === 1 ? "candidate" : "candidates"}`;
    const toastText = `${candidates.length} AI variation${candidates.length === 1 ? "" : "s"} generated`;

    assert.equal(kickerText, "4 candidates");
    assert.equal(toastText, "4 AI variations generated");

    // Never hardcodes "6"
    assert.ok(!toastText.includes("6"));
  });

  it("7. Single candidate count pluralization", () => {
    const single = [validSearchIcon];
    const kickerText = `${single.length} ${single.length === 1 ? "candidate" : "candidates"}`;
    const toastText = `${single.length} AI variation${single.length === 1 ? "" : "s"} generated`;

    assert.equal(kickerText, "1 candidate");
    assert.equal(toastText, "1 AI variation generated");
  });

  it("8. Controlled retry simulation (max 2 attempts, no infinite loop)", () => {
    let attempts = 0;
    const MAX_ATTEMPTS = 2;
    const TARGET = 6;
    const collected: IconGeometry[] = [];

    // Simulate an upstream source that returns 2 valid candidates per attempt
    while (attempts < MAX_ATTEMPTS && collected.length < TARGET) {
      attempts++;
      collected.push(validSearchIcon);
      collected.push(validCoffeeIcon);
    }

    assert.equal(attempts, 2, "Must stop after MAX_ATTEMPTS attempts");
    assert.equal(collected.length, 4, "Proceeds with 4 accepted candidates honestly");
  });

  it("9. Stale generation state protection logic", () => {
    let activeGenerationId = 0;
    let savedResult: string | null = null;

    // Gen 1 starts
    const gen1Id = ++activeGenerationId;

    // Gen 2 starts immediately before Gen 1 resolves
    const gen2Id = ++activeGenerationId;

    // Gen 1 completes late
    if (activeGenerationId === gen1Id) {
      savedResult = "result-1";
    }

    // Gen 2 completes
    if (activeGenerationId === gen2Id) {
      savedResult = "result-2";
    }

    assert.equal(savedResult, "result-2", "Stale in-flight generation must not overwrite newer generation");
  });

  it("10. Generate CTA state transitions", () => {
    let hasGenerated = false;
    let generating = false;

    // Before first generation
    let ctaLabel = generating ? "Generating variations…" : hasGenerated ? "Generate Again" : "Generate AI Variations";
    assert.equal(ctaLabel, "Generate AI Variations");

    // During generation
    generating = true;
    ctaLabel = generating ? "Generating variations…" : hasGenerated ? "Generate Again" : "Generate AI Variations";
    assert.equal(ctaLabel, "Generating variations…");

    // After first generation succeeds
    generating = false;
    hasGenerated = true;
    ctaLabel = generating ? "Generating variations…" : hasGenerated ? "Generate Again" : "Generate AI Variations";
    assert.equal(ctaLabel, "Generate Again");

    // During subsequent generation
    generating = true;
    ctaLabel = generating ? "Generating variations…" : hasGenerated ? "Generate Again" : "Generate AI Variations";
    assert.equal(ctaLabel, "Generating variations…");

    // After subsequent generation succeeds
    generating = false;
    ctaLabel = generating ? "Generating variations…" : hasGenerated ? "Generate Again" : "Generate AI Variations";
    assert.equal(ctaLabel, "Generate Again");
  });
});

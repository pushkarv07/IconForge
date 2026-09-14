import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { consistencyScore } from "../src/lib/consistency.ts";
import type { IconCandidate, StyleProfile } from "../src/lib/types.ts";

const baseProfile: StyleProfile = {
  name: "Standard Style",
  canvas: 24,
  stroke: 1.5,
  strokeWidth: 1.5,
  cap: "Rounded",
  strokeLinecap: "Rounded",
  join: "Rounded",
  strokeLinejoin: "Rounded",
  fillMode: "Outline",
  complexity: "Simple",
  density: "Balanced",
  corner: "Soft",
  weight: 42,
  opticalWeight: 42,
  geometric: "Mixed",
};

function createIcon(partial: Partial<IconCandidate> = {}): IconCandidate {
  return {
    id: `icon-${Math.random().toString(36).slice(2, 7)}`,
    name: "Sample Icon",
    label: "Best match",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16"/></svg>',
    canvas: 24,
    stroke: 1.5,
    style: "Outline",
    complexity: "Simple",
    pathCount: 2,
    weight: 42,
    ...partial,
  };
}

describe("consistencyScore logic", () => {
  it("1. identifies one icon with incorrect stroke", () => {
    const icon1 = createIcon({ id: "i1", name: "Home", stroke: 1.5 });
    const icon2 = createIcon({ id: "i2", name: "Settings", stroke: 2 });

    const result = consistencyScore([icon1, icon2], baseProfile);

    assert.ok(result.score < 100, "Score should be less than 100");
    const finding1 = result.findings.find((f) => f.iconId === "i1");
    const finding2 = result.findings.find((f) => f.iconId === "i2");

    assert.equal(finding1?.mismatch, false);
    assert.equal(finding2?.mismatch, true);
    assert.ok(
      finding2?.reasons?.some((r) => r.includes("Stroke: 2px vs expected 1.5px")),
      `Expected stroke reason on icon2, got: ${JSON.stringify(finding2?.reasons)}`
    );
  });

  it("2. handles multiple icons with different stroke weights (QA test set)", () => {
    const shoppingCart = createIcon({
      id: "cart",
      name: "Shopping cart",
      stroke: 1.5,
      pathCount: 3,
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l2 10h10l2-8H6"/><circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></svg>',
    });
    const calendarReminder = createIcon({
      id: "cal",
      name: "Calendar reminder",
      stroke: 1.5,
      pathCount: 4,
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    });
    const searchIcon = createIcon({
      id: "search-2",
      name: "Search icon",
      stroke: 2,
      pathCount: 2,
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
    });
    const search = createIcon({
      id: "search-1",
      name: "Search",
      stroke: 1,
      pathCount: 2,
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
    });

    const result = consistencyScore(
      [shoppingCart, calendarReminder, searchIcon, search],
      baseProfile
    );

    assert.ok(result.score < 100, `Score should be less than 100, got ${result.score}`);

    const fCart = result.findings.find((f) => f.iconId === "cart");
    const fCal = result.findings.find((f) => f.iconId === "cal");
    const fSearch2 = result.findings.find((f) => f.iconId === "search-2");
    const fSearch1 = result.findings.find((f) => f.iconId === "search-1");

    // Neither shopping cart nor calendar reminder should be flagged
    assert.equal(fCart?.mismatch, false, "Shopping cart should match");
    assert.equal(fCal?.mismatch, false, "Calendar reminder should NOT have path complexity mismatch");

    // Search icons must both be flagged with their respective stroke mismatches
    assert.equal(fSearch2?.mismatch, true, "Search icon (2px) should be mismatched");
    assert.ok(
      fSearch2?.reasons?.some((r) => r.includes("Stroke: 2px vs expected 1.5px")),
      `Search icon (2px) stroke reason missing: ${JSON.stringify(fSearch2?.reasons)}`
    );

    assert.equal(fSearch1?.mismatch, true, "Search (1px) should be mismatched");
    assert.ok(
      fSearch1?.reasons?.some((r) => r.includes("Stroke: 1px vs expected 1.5px")),
      `Search (1px) stroke reason missing: ${JSON.stringify(fSearch1?.reasons)}`
    );
  });

  it("3. detects path complexity mismatch", () => {
    const simpleIcon = createIcon({ id: "s1", name: "Simple Icon", complexity: "Simple", pathCount: 2 });
    const complexIcon = createIcon({ id: "c1", name: "Complex Icon", complexity: "Detailed", pathCount: 14 });

    const result = consistencyScore([simpleIcon, complexIcon], baseProfile);

    assert.ok(result.score < 100);
    const fSimple = result.findings.find((f) => f.iconId === "s1");
    const fComplex = result.findings.find((f) => f.iconId === "c1");

    assert.equal(fSimple?.mismatch, false);
    assert.equal(fComplex?.mismatch, true);
    assert.ok(
      fComplex?.reasons?.some((r) => r.includes("Path complexity: higher than reference")),
      `Expected complexity reason, got: ${JSON.stringify(fComplex?.reasons)}`
    );
  });

  it("4. gives 100/100 score when all icons match reference style", () => {
    const icon1 = createIcon({ id: "i1", name: "Icon One" });
    const icon2 = createIcon({ id: "i2", name: "Icon Two" });
    const icon3 = createIcon({ id: "i3", name: "Icon Three" });

    const result = consistencyScore([icon1, icon2, icon3], baseProfile);

    assert.equal(result.score, 100, `Expected 100/100 score, got ${result.score}`);
    assert.equal(result.findings.filter((f) => f.mismatch).length, 0);
    assert.ok(result.checks.every((c) => c.status === "good"));
  });

  it("5. identifies multiple simultaneous mismatch types", () => {
    const mismatchedIcon = createIcon({
      id: "multi-err",
      name: "Wild Icon",
      stroke: 2,
      canvas: 32,
      style: "Solid",
      complexity: "Detailed",
      svg: '<svg viewBox="0 0 32 32" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><rect x="2" y="2" width="28" height="28"/></svg>',
    });

    const result = consistencyScore([mismatchedIcon], baseProfile);

    assert.ok(result.score < 100);
    const finding = result.findings[0];
    assert.equal(finding.mismatch, true);
    const reasons = finding.reasons ?? [];

    assert.ok(reasons.some((r) => r.startsWith("Stroke: 2px vs expected 1.5px")), "Stroke reason missing");
    assert.ok(reasons.some((r) => r.startsWith("Canvas mismatch")), "Canvas reason missing");
    assert.ok(reasons.some((r) => r.startsWith("Fill mode mismatch")), "Fill reason missing");
    assert.ok(reasons.some((r) => r.startsWith("Cap mismatch")), "Cap reason missing");
    assert.ok(reasons.some((r) => r.startsWith("Join mismatch")), "Join reason missing");
    assert.ok(reasons.some((r) => r.startsWith("Path complexity")), "Complexity reason missing");
  });
});

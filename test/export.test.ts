import { describe, it } from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import {
  sanitizeFileName,
  generateUniqueFileNames,
  buildIconSetZip,
} from "../src/lib/export.ts";
import type { IconCandidate, IconSet } from "../src/lib/types.ts";

function createCandidate(id: string, name: string, pathData = "M4 12h16"): IconCandidate {
  return {
    id,
    name,
    label: "Best match",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" data-id="${id}"><path d="${pathData}"/></svg>`,
    canvas: 24,
    stroke: 1.5,
    style: "Outline",
    complexity: "Simple",
    pathCount: 1,
    weight: 42,
  };
}

function createSet(name: string, icons: IconCandidate[]): IconSet {
  const now = new Date().toISOString();
  return {
    id: `set-${Date.now()}`,
    name,
    description: "Test icon set",
    icons,
    profile: {
      name: "Default Profile",
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
    },
    createdAt: now,
    updatedAt: now,
  };
}

describe("Export reliability and unique filename suite", () => {
  it("1. sanitizeFileName cleans special characters and whitespace", () => {
    assert.equal(sanitizeFileName("Coffee Cup with Steam!"), "coffee-cup-with-steam");
    assert.equal(sanitizeFileName("  light   "), "light");
    assert.equal(sanitizeFileName("Search & Find..."), "search-find");
    assert.equal(sanitizeFileName(""), "icon");
    assert.equal(sanitizeFileName("---"), "icon");
  });

  it("2. generateUniqueFileNames produces deterministic unique names without collision", () => {
    const icons: Pick<IconCandidate, "name" | "id">[] = [
      { name: "calendar", id: "1" },
      { name: "coffee cup with steam", id: "2" },
      { name: "coffee cup with steam", id: "3" },
      { name: "light", id: "4" },
      { name: "light", id: "5" },
      { name: "search", id: "6" },
      { name: "search", id: "7" },
    ];

    const names = generateUniqueFileNames(icons);
    assert.deepEqual(names, [
      "calendar.svg",
      "coffee-cup-with-steam.svg",
      "coffee-cup-with-steam-2.svg",
      "light.svg",
      "light-2.svg",
      "search.svg",
      "search-2.svg",
    ]);
  });

  it("3. handles preexisting numbered suffix without collision", () => {
    const icons: Pick<IconCandidate, "name" | "id">[] = [
      { name: "light", id: "1" },
      { name: "light-2", id: "2" },
      { name: "light", id: "3" },
    ];

    const names = generateUniqueFileNames(icons);
    assert.equal(new Set(names).size, 3, "All filenames must be unique");
    assert.deepEqual(names, [
      "light.svg",
      "light-2.svg",
      "light-3.svg",
    ]);
  });

  it("4. exports exactly 7 icons when set has 7 icons with duplicates", async () => {
    const icons: IconCandidate[] = [
      createCandidate("c1", "calendar", "M3 4h18v18H3z"),
      createCandidate("c2", "coffee cup with steam", "M6 8h12v10H6z"),
      createCandidate("c3", "coffee cup with steam", "M8 2v4m4-4v4"),
      createCandidate("l1", "light", "M12 2v4m0 12v4"),
      createCandidate("l2", "light", "M12 7a5 5 0 0 1 5 5"),
      createCandidate("s1", "search", "M11 11m-8 0a8 8 0 1 0 16 0"),
      createCandidate("s2", "search", "M21 21l-4.35-4.35"),
    ];

    const set = createSet("Test 7 Icons", icons);
    const result = await buildIconSetZip(set);

    assert.equal(result.entryCount, 7, "Must contain exactly 7 entries");
    assert.equal(result.fileNames.length, 7);
    assert.equal(result.zipFileName, "test-7-icons.zip");

    // Load the generated ZIP and inspect every entry
    const loadedZip = await JSZip.loadAsync(result.zipBlob);
    const files = Object.keys(loadedZip.files).filter((k) => !loadedZip.files[k].dir);

    assert.equal(files.length, 7, "Archive must have exactly 7 files");

    // Verify all expected filenames exist
    const expected = [
      "calendar.svg",
      "coffee-cup-with-steam.svg",
      "coffee-cup-with-steam-2.svg",
      "light.svg",
      "light-2.svg",
      "search.svg",
      "search-2.svg",
    ];
    for (const exp of expected) {
      assert.ok(files.includes(exp), `Archive should contain ${exp}`);
    }

    // Verify contents of each file correspond to the correct icon
    for (let i = 0; i < icons.length; i++) {
      const fileName = result.fileNames[i];
      const content = await loadedZip.file(fileName)!.async("string");
      assert.ok(content.includes(`data-id="${icons[i].id}"`), `File ${fileName} must match icon ${icons[i].id}`);
      assert.ok(content.startsWith("<svg"), `File ${fileName} must be valid SVG`);
      assert.ok(content.endsWith("</svg>"), `File ${fileName} must end with </svg>`);
    }
  });

  it("5. exports exactly 1 icon when set has 1 icon", async () => {
    const icons = [createCandidate("single-1", "dashboard")];
    const set = createSet("Single Icon Set", icons);
    const result = await buildIconSetZip(set);

    assert.equal(result.entryCount, 1);
    assert.deepEqual(result.fileNames, ["dashboard.svg"]);

    const loadedZip = await JSZip.loadAsync(result.zipBlob);
    const files = Object.keys(loadedZip.files);
    assert.equal(files.length, 1);
    assert.equal(files[0], "dashboard.svg");
  });

  it("6. exports exactly 4 icons when set has 4 icons", async () => {
    const icons = [
      createCandidate("a1", "heart"),
      createCandidate("a2", "heart"),
      createCandidate("a3", "star"),
      createCandidate("a4", "bell"),
    ];
    const set = createSet("Four Icons", icons);
    const result = await buildIconSetZip(set);

    assert.equal(result.entryCount, 4);
    assert.deepEqual(result.fileNames, [
      "heart.svg",
      "heart-2.svg",
      "star.svg",
      "bell.svg",
    ]);

    const loadedZip = await JSZip.loadAsync(result.zipBlob);
    const files = Object.keys(loadedZip.files);
    assert.equal(files.length, 4);
  });

  it("7. throws error and refuses export if set is empty", async () => {
    const set = createSet("Empty Set", []);
    await assert.rejects(
      async () => await buildIconSetZip(set),
      /Cannot export: Icon set has no icons/
    );
  });

  it("8. throws error and refuses export if any icon has invalid/empty SVG", async () => {
    const icons = [
      createCandidate("ok", "good"),
      { ...createCandidate("bad", "broken"), svg: "" },
    ];
    const set = createSet("Broken Set", icons);
    await assert.rejects(
      async () => await buildIconSetZip(set),
      /Invalid SVG data/
    );
  });
});

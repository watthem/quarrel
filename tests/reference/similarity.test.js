/**
 * Similarity Tests
 *
 * Validates documented claims from docs/reference.md:
 * - cosineSimilarity (lines 206-209)
 * - calculateSimilarities (lines 214-241)
 */

import { describe, it, expect } from "vitest";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const quarrel = require("../../index.cjs");

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors (reference.md:207)", () => {
    const result = quarrel.cosineSimilarity([1, 0, 0], [1, 0, 0]);
    expect(result).toBe(1);
  });

  it("returns 0 for orthogonal vectors (reference.md:208)", () => {
    const result = quarrel.cosineSimilarity([1, 0, 0], [0, 1, 0]);
    expect(result).toBe(0);
  });

  it("returns ~0.707 for 45-degree vectors (reference.md:209)", () => {
    const result = quarrel.cosineSimilarity([1, 1, 0], [1, 0, 0]);
    expect(result).toBeCloseTo(0.707, 2);
  });

  it("returns 0 for null vectors (reference.md:204)", () => {
    expect(quarrel.cosineSimilarity(null, [1, 0])).toBe(0);
    expect(quarrel.cosineSimilarity([1, 0], null)).toBe(0);
    expect(quarrel.cosineSimilarity(null, null)).toBe(0);
  });

  it("returns 0 for empty vectors (reference.md:204)", () => {
    expect(quarrel.cosineSimilarity([], [])).toBe(0);
    expect(quarrel.cosineSimilarity([1], [])).toBe(0);
  });

  it("returns 0 for mismatched vector lengths (reference.md:204)", () => {
    expect(quarrel.cosineSimilarity([1, 0], [1, 0, 0])).toBe(0);
  });

  it("returns 0 for zero vectors", () => {
    expect(quarrel.cosineSimilarity([0, 0, 0], [1, 0, 0])).toBe(0);
    expect(quarrel.cosineSimilarity([1, 0, 0], [0, 0, 0])).toBe(0);
  });

  it("handles negative values correctly", () => {
    // Opposite directions should give -1
    const result = quarrel.cosineSimilarity([1, 0], [-1, 0]);
    expect(result).toBeCloseTo(-1, 5);
  });

  it("is symmetric", () => {
    const a = [1, 2, 3];
    const b = [4, 5, 6];
    expect(quarrel.cosineSimilarity(a, b)).toBe(quarrel.cosineSimilarity(b, a));
  });
});

describe("calculateSimilarities", () => {
  it("returns a map from each ID to its matches (reference.md:223-225)", () => {
    const items = [
      { id: "a", title: "Note A", embedding: [1, 0, 0] },
      { id: "b", title: "Note B", embedding: [0.9, 0.1, 0] },
      { id: "c", title: "Note C", embedding: [0, 0, 1] },
    ];
    const result = quarrel.calculateSimilarities(items);

    expect(result).toHaveProperty("a");
    expect(result).toHaveProperty("b");
    expect(result).toHaveProperty("c");
  });

  it("returns matches sorted by similarity score (reference.md:225)", () => {
    const items = [
      { id: "a", title: "Note A", embedding: [1, 0, 0] },
      { id: "b", title: "Note B", embedding: [0.9, 0.1, 0] },
      { id: "c", title: "Note C", embedding: [0, 0, 1] },
    ];
    const result = quarrel.calculateSimilarities(items);

    // For item "a", "b" should be more similar than "c"
    expect(result["a"][0].id).toBe("b");
    expect(result["a"][1].id).toBe("c");
    expect(result["a"][0].similarity).toBeGreaterThan(result["a"][1].similarity);
  });

  it("respects maxSimilar option (reference.md:234)", () => {
    const items = [
      { id: "a", title: "A", embedding: [1, 0, 0] },
      { id: "b", title: "B", embedding: [0.9, 0.1, 0] },
      { id: "c", title: "C", embedding: [0.8, 0.2, 0] },
      { id: "d", title: "D", embedding: [0.7, 0.3, 0] },
    ];
    const result = quarrel.calculateSimilarities(items, { maxSimilar: 2 });

    expect(result["a"].length).toBe(2);
  });

  it("excludes self from matches", () => {
    const items = [
      { id: "a", title: "Note A", embedding: [1, 0, 0] },
      { id: "b", title: "Note B", embedding: [1, 0, 0] },
    ];
    const result = quarrel.calculateSimilarities(items);

    // "a" should not appear in its own matches
    const aMatches = result["a"];
    expect(aMatches.every((m) => m.id !== "a")).toBe(true);
  });

  it("includes title and similarity in match objects (reference.md:237-240)", () => {
    const items = [
      { id: "a", title: "Note A", embedding: [1, 0, 0] },
      { id: "b", title: "Note B", embedding: [0.9, 0.1, 0] },
    ];
    const result = quarrel.calculateSimilarities(items);

    const match = result["a"][0];
    expect(match).toHaveProperty("id");
    expect(match).toHaveProperty("title");
    expect(match).toHaveProperty("similarity");
    expect(typeof match.similarity).toBe("number");
  });
});

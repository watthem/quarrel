/**
 * Determinism Tests
 *
 * Validates documented claims from docs/explainer.md:
 * - Same inputs produce identical vectors across multiple runs (line 86)
 * - Same inputs produce identical similarity scores (line 86)
 * - No randomness, no external calls (line 86)
 */

import { describe, it, expect } from "vitest";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const quarrel = require("../../index.cjs");

describe("determinism (explainer.md:86)", () => {
  it("same inputs produce identical vectors across multiple runs", () => {
    const texts = [
      "javascript closures and scope",
      "python decorators and generators",
      "rust ownership and borrowing",
    ];

    // Run vectorization multiple times
    const result1 = quarrel.buildTfidfVectors(texts);
    const result2 = quarrel.buildTfidfVectors(texts);
    const result3 = quarrel.buildTfidfVectors(texts);

    // Vocabularies should be identical
    expect(result1.vocab).toEqual(result2.vocab);
    expect(result2.vocab).toEqual(result3.vocab);

    // Vectors should be identical
    expect(result1.vectors).toEqual(result2.vectors);
    expect(result2.vectors).toEqual(result3.vectors);
  });

  it("same inputs produce identical hashed vectors", () => {
    const texts = [
      "javascript closures and scope",
      "python decorators and generators",
    ];

    const result1 = quarrel.buildHashedTfidfVectors(texts);
    const result2 = quarrel.buildHashedTfidfVectors(texts);
    const result3 = quarrel.buildHashedTfidfVectors(texts);

    expect(result1.vectors).toEqual(result2.vectors);
    expect(result2.vectors).toEqual(result3.vectors);
  });

  it("same inputs produce identical similarity scores", () => {
    const items = [
      { id: "a", title: "Note A", embedding: [1, 0.5, 0.2] },
      { id: "b", title: "Note B", embedding: [0.9, 0.4, 0.1] },
      { id: "c", title: "Note C", embedding: [0.1, 0.8, 0.9] },
    ];

    const result1 = quarrel.calculateSimilarities(items);
    const result2 = quarrel.calculateSimilarities(items);
    const result3 = quarrel.calculateSimilarities(items);

    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);
  });

  it("tokenization is deterministic", () => {
    const text = "The quick brown fox jumps over the lazy dog";

    const result1 = quarrel.tokenize(text);
    const result2 = quarrel.tokenize(text);
    const result3 = quarrel.tokenize(text);

    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);
  });

  it("fingerprinting is deterministic", () => {
    const text = "content that might change between runs";

    const hash1 = quarrel.fingerprintText(text);
    const hash2 = quarrel.fingerprintText(text);
    const hash3 = quarrel.fingerprintText(text);

    expect(hash1).toBe(hash2);
    expect(hash2).toBe(hash3);
  });

  it("normalizeMarkdown is deterministic", () => {
    const markdown = "# Title\n\n**Bold** and [link](url)";

    const result1 = quarrel.normalizeMarkdown(markdown);
    const result2 = quarrel.normalizeMarkdown(markdown);
    const result3 = quarrel.normalizeMarkdown(markdown);

    expect(result1).toBe(result2);
    expect(result2).toBe(result3);
  });

  it("vectorizeDocuments is deterministic", () => {
    const docs = [
      { id: "1", title: "First", content: "# Hello\n\nWorld content" },
      { id: "2", title: "Second", content: "# Another\n\nDocument here" },
    ];

    const result1 = quarrel.vectorizeDocuments(docs);
    const result2 = quarrel.vectorizeDocuments(docs);
    const result3 = quarrel.vectorizeDocuments(docs);

    expect(result1.vectors).toEqual(result2.vectors);
    expect(result2.vectors).toEqual(result3.vectors);
    expect(result1.texts).toEqual(result2.texts);
    expect(result2.texts).toEqual(result3.texts);
  });

  it("full pipeline is deterministic end-to-end", () => {
    const docs = [
      { id: "a", title: "JavaScript", content: "Closures and functions" },
      { id: "b", title: "Python", content: "Decorators and generators" },
      { id: "c", title: "Rust", content: "Ownership and borrowing" },
    ];

    // Run the full pipeline twice
    const run1 = () => {
      const { vectors } = quarrel.vectorizeDocuments(docs);
      const items = docs.map((d, i) => ({
        id: d.id,
        title: d.title,
        embedding: vectors[i],
      }));
      return quarrel.calculateSimilarities(items);
    };

    const result1 = run1();
    const result2 = run1();

    expect(result1).toEqual(result2);
  });
});

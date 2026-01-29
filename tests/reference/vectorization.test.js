/**
 * Vectorization Tests
 *
 * Validates documented claims from docs/reference.md:
 * - buildTfidfVectors (lines 122-133)
 * - buildHashedTfidfVectors (lines 136-155)
 * - vectorizeDocuments (lines 159-187)
 */

import { describe, it, expect } from "vitest";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const quarrel = require("../../index.js");

describe("buildTfidfVectors", () => {
  it("returns vectors where vectors[0].length === vocab.length (reference.md:124-125)", () => {
    const { vectors, vocab } = quarrel.buildTfidfVectors([
      "javascript closures are useful",
      "python decorators are elegant",
    ]);
    expect(vectors[0].length).toBe(vocab.length);
    expect(vectors[1].length).toBe(vocab.length);
  });

  it("returns one vector per input text", () => {
    const texts = ["first document", "second document", "third document"];
    const { vectors } = quarrel.buildTfidfVectors(texts);
    expect(vectors.length).toBe(texts.length);
  });

  it("respects maxVocab option", () => {
    const texts = [
      "apple banana cherry date elderberry fig grape",
      "honeydew kiwi lemon mango nectarine orange papaya",
    ];
    const { vocab } = quarrel.buildTfidfVectors(texts, { maxVocab: 5 });
    expect(vocab.length).toBeLessThanOrEqual(5);
  });

  it("produces L2-normalized vectors", () => {
    const { vectors } = quarrel.buildTfidfVectors([
      "some meaningful content here for testing",
      "different content about other topics",
    ]);
    for (const vec of vectors) {
      const magnitude = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
      // Should be ~1.0 (or 0 for empty vectors)
      if (magnitude > 0) {
        expect(magnitude).toBeCloseTo(1.0, 5);
      }
    }
  });
});

describe("buildHashedTfidfVectors", () => {
  it("defaults to 2048 dimensions (reference.md:143)", () => {
    const { vectors } = quarrel.buildHashedTfidfVectors([
      "javascript closures",
      "python decorators",
    ]);
    expect(vectors[0].length).toBe(2048);
    expect(vectors[1].length).toBe(2048);
  });

  it("respects hashDim option (reference.md:150-154)", () => {
    const { vectors } = quarrel.buildHashedTfidfVectors(
      ["javascript closures", "python decorators"],
      { hashDim: 512 }
    );
    expect(vectors[0].length).toBe(512);
    expect(vectors[1].length).toBe(512);
  });

  it("returns one vector per input text", () => {
    const texts = ["first", "second", "third"];
    const { vectors } = quarrel.buildHashedTfidfVectors(texts);
    expect(vectors.length).toBe(texts.length);
  });

  it("does not return vocab (unlike buildTfidfVectors)", () => {
    const result = quarrel.buildHashedTfidfVectors(["test text"]);
    expect(result.vocab).toBeUndefined();
  });

  it("produces L2-normalized vectors", () => {
    const { vectors } = quarrel.buildHashedTfidfVectors([
      "some meaningful content here for testing",
      "different content about other topics",
    ]);
    for (const vec of vectors) {
      const magnitude = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
      if (magnitude > 0) {
        expect(magnitude).toBeCloseTo(1.0, 5);
      }
    }
  });
});

describe("vectorizeDocuments", () => {
  it("returns vocab only when useHashing is false (reference.md:176)", () => {
    const docs = [
      { id: "a", title: "Title A", content: "Content for document A" },
      { id: "b", title: "Title B", content: "Content for document B" },
    ];

    const withoutHashing = quarrel.vectorizeDocuments(docs, {
      useHashing: false,
    });
    expect(withoutHashing.vocab).toBeDefined();
    expect(Array.isArray(withoutHashing.vocab)).toBe(true);

    const withHashing = quarrel.vectorizeDocuments(docs, { useHashing: true });
    expect(withHashing.vocab).toBeUndefined();
  });

  it("returns texts array with cleaned strings", () => {
    const docs = [
      { id: "a", title: "Note", content: "# Heading\n\nSome **bold** text" },
    ];
    const { texts } = quarrel.vectorizeDocuments(docs);
    expect(texts).toBeDefined();
    expect(texts.length).toBe(1);
    // Should contain cleaned text without markdown
    expect(texts[0]).not.toContain("#");
    expect(texts[0]).not.toContain("**");
  });

  it("handles documents without titles", () => {
    const docs = [{ id: "a", content: "Just content here" }];
    const { vectors, texts } = quarrel.vectorizeDocuments(docs);
    expect(vectors.length).toBe(1);
    expect(texts.length).toBe(1);
  });

  it("respects contentExcerptLength option", () => {
    const longContent = "word ".repeat(1000);
    const docs = [{ id: "a", title: "", content: longContent }];

    const { texts: short } = quarrel.vectorizeDocuments(docs, {
      contentExcerptLength: 50,
    });
    const { texts: long } = quarrel.vectorizeDocuments(docs, {
      contentExcerptLength: 500,
    });

    expect(short[0].length).toBeLessThan(long[0].length);
  });
});

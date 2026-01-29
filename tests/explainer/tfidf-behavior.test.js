/**
 * TF-IDF Behavior Tests
 *
 * Validates documented claims from docs/explainer.md:
 * - Words frequent in one doc but rare everywhere else score highest (lines 26-34)
 * - Words appearing everywhere score near zero (line 34)
 * - L2 normalization: all vectors have magnitude ~1.0 (lines 36-39)
 */

import { describe, it, expect } from "vitest";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const quarrel = require("../../index.js");

describe("TF-IDF weighting behavior (explainer.md:26-38)", () => {
  it("words frequent in one doc but rare everywhere else score highest", () => {
    // "unique" appears only in doc 0, "common" appears in all docs
    const texts = [
      "unique unique unique common",
      "common other words here",
      "common more different text",
    ];

    const { vectors, vocab } = quarrel.buildTfidfVectors(texts);

    // Find indices for our test words
    const uniqueIdx = vocab.indexOf("unique");
    const commonIdx = vocab.indexOf("common");

    // "unique" should have a high score in doc 0 (frequent + rare)
    // "common" should have a lower score (appears everywhere)
    expect(uniqueIdx).toBeGreaterThanOrEqual(0);
    expect(commonIdx).toBeGreaterThanOrEqual(0);

    // In doc 0, "unique" should score higher than "common"
    expect(vectors[0][uniqueIdx]).toBeGreaterThan(vectors[0][commonIdx]);
  });

  it("words appearing in all documents score lower due to IDF", () => {
    const texts = [
      "shared word appears everywhere plus alpha",
      "shared word appears everywhere plus beta",
      "shared word appears everywhere plus gamma",
    ];

    const { vectors, vocab } = quarrel.buildTfidfVectors(texts);

    // Find indices
    const sharedIdx = vocab.indexOf("shared");
    const alphaIdx = vocab.indexOf("alpha");

    expect(sharedIdx).toBeGreaterThanOrEqual(0);
    expect(alphaIdx).toBeGreaterThanOrEqual(0);

    // "alpha" only appears in doc 0, "shared" appears everywhere
    // So "alpha" should have higher weight in doc 0
    expect(vectors[0][alphaIdx]).toBeGreaterThan(vectors[0][sharedIdx]);
  });

  it("L2 normalization: all vectors have magnitude ~1.0", () => {
    const texts = [
      "short text here",
      "this is a much longer document with many more words to test normalization behavior",
      "medium length document with some content",
    ];

    const { vectors } = quarrel.buildTfidfVectors(texts);

    for (const vec of vectors) {
      const magnitude = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
      // Each normalized vector should have magnitude ~1.0
      if (magnitude > 0) {
        expect(magnitude).toBeCloseTo(1.0, 5);
      }
    }
  });

  it("normalization makes document length irrelevant for similarity", () => {
    // Two short docs about the same topic
    const shortAboutJS = "javascript functions closures";
    const longAboutJS =
      "javascript functions closures variables scope prototype chain event loop";

    // One doc about a different topic
    const aboutPython = "python decorators generators asyncio";

    const texts = [shortAboutJS, longAboutJS, aboutPython];
    const { vectors } = quarrel.buildTfidfVectors(texts);

    // Short JS doc should be more similar to long JS doc than to Python doc
    const shortToLongJS = quarrel.cosineSimilarity(vectors[0], vectors[1]);
    const shortToPython = quarrel.cosineSimilarity(vectors[0], vectors[2]);

    expect(shortToLongJS).toBeGreaterThan(shortToPython);
  });
});

describe("feature hashing TF-IDF behavior", () => {
  it("maintains similar TF-IDF weighting properties with hashing", () => {
    const texts = [
      "unique unique unique common",
      "common other words here",
      "common more different text",
    ];

    const { vectors: standard } = quarrel.buildTfidfVectors(texts);
    const { vectors: hashed } = quarrel.buildHashedTfidfVectors(texts);

    // Both methods should produce normalized vectors
    for (const vec of hashed) {
      const magnitude = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
      if (magnitude > 0) {
        expect(magnitude).toBeCloseTo(1.0, 5);
      }
    }

    // Similarity rankings should be similar between methods
    // Doc 0 vs Doc 1 and Doc 0 vs Doc 2
    const sim01_std = quarrel.cosineSimilarity(standard[0], standard[1]);
    const sim02_std = quarrel.cosineSimilarity(standard[0], standard[2]);
    const sim01_hash = quarrel.cosineSimilarity(hashed[0], hashed[1]);
    const sim02_hash = quarrel.cosineSimilarity(hashed[0], hashed[2]);

    // Rankings should be preserved (though exact values may differ)
    if (sim01_std > sim02_std) {
      expect(sim01_hash).toBeGreaterThan(sim02_hash);
    }
  });
});

/**
 * Obsidian Similar Notes Example Tests
 *
 * Validates examples/obsidian-similar-notes.js:
 * - Exports SimilarNotesIndex class
 * - Constructor accepts mock app object
 * - async buildIndex() builds vectors from vault
 * - findSimilar() returns sorted scores
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { SimilarNotesIndex } = require("../../examples/obsidian-similar-notes.js");

/**
 * Create a mock Obsidian app object with async cachedRead
 */
function createMockApp(files = []) {
  return {
    vault: {
      getMarkdownFiles: vi.fn(() => files),
      cachedRead: vi.fn(async (file) => file.content || ""),
    },
  };
}

/**
 * Create mock file objects
 */
function createMockFile(path, basename, content) {
  return { path, basename, content };
}

describe("obsidian-similar-notes.js exports", () => {
  it("exports SimilarNotesIndex class", () => {
    expect(SimilarNotesIndex).toBeDefined();
    expect(typeof SimilarNotesIndex).toBe("function");
  });
});

describe("SimilarNotesIndex constructor", () => {
  it("accepts mock app object", () => {
    const mockApp = createMockApp();
    const index = new SimilarNotesIndex(mockApp);

    expect(index).toBeInstanceOf(SimilarNotesIndex);
    expect(index.app).toBe(mockApp);
  });

  it("does not call buildIndex on construction", () => {
    const mockApp = createMockApp();
    new SimilarNotesIndex(mockApp);

    // buildIndex is now async and must be called explicitly
    expect(mockApp.vault.getMarkdownFiles).not.toHaveBeenCalled();
  });

  it("accepts custom options", () => {
    const mockApp = createMockApp();
    const options = { maxResults: 10, minSimilarity: 0.2 };
    const index = new SimilarNotesIndex(mockApp, options);

    expect(index.options.maxResults).toBe(10);
    expect(index.options.minSimilarity).toBe(0.2);
  });

  it("initializes with empty documents and vectors", () => {
    const mockApp = createMockApp();
    const index = new SimilarNotesIndex(mockApp);

    expect(index.documents).toEqual([]);
    expect(index.vectors).toEqual([]);
  });
});

describe("SimilarNotesIndex.buildIndex()", () => {
  it("is an async function", () => {
    const mockApp = createMockApp();
    const index = new SimilarNotesIndex(mockApp);

    expect(index.buildIndex()).toBeInstanceOf(Promise);
  });

  it("calls vault.getMarkdownFiles", async () => {
    const mockApp = createMockApp();
    const index = new SimilarNotesIndex(mockApp);

    await index.buildIndex();

    expect(mockApp.vault.getMarkdownFiles).toHaveBeenCalled();
  });

  it("calls vault.cachedRead for each file", async () => {
    const files = [
      createMockFile("a.md", "a", "content a"),
      createMockFile("b.md", "b", "content b"),
    ];
    const mockApp = createMockApp(files);
    const index = new SimilarNotesIndex(mockApp);

    await index.buildIndex();

    expect(mockApp.vault.cachedRead).toHaveBeenCalledTimes(2);
    expect(mockApp.vault.cachedRead).toHaveBeenCalledWith(files[0]);
    expect(mockApp.vault.cachedRead).toHaveBeenCalledWith(files[1]);
  });

  it("populates documents array", async () => {
    const files = [createMockFile("test.md", "test", "test content")];
    const mockApp = createMockApp(files);
    const index = new SimilarNotesIndex(mockApp);

    await index.buildIndex();

    expect(index.documents).toHaveLength(1);
    expect(index.documents[0]).toEqual({
      id: "test.md",
      title: "test",
      path: "test.md",
      content: "test content",
    });
  });

  it("populates vectors array", async () => {
    const files = [createMockFile("test.md", "test", "test content")];
    const mockApp = createMockApp(files);
    const index = new SimilarNotesIndex(mockApp);

    await index.buildIndex();

    expect(index.vectors).toHaveLength(1);
    expect(Array.isArray(index.vectors[0])).toBe(true);
  });

  it("handles empty vault", async () => {
    const mockApp = createMockApp([]);
    const index = new SimilarNotesIndex(mockApp);

    await index.buildIndex();

    expect(index.documents).toEqual([]);
    expect(index.vectors).toEqual([]);
  });

  it("can be called to rebuild the index", async () => {
    const files = [createMockFile("test.md", "test", "initial content")];
    const mockApp = createMockApp(files);
    const index = new SimilarNotesIndex(mockApp);

    await index.buildIndex();
    const initialVectors = [...index.vectors];

    // Simulate file content change
    files[0].content = "completely different content now";
    await index.buildIndex();

    // Vectors should be different after rebuild
    expect(index.vectors).not.toEqual(initialVectors);
  });
});

describe("SimilarNotesIndex.findSimilar()", () => {
  let mockApp;
  let index;
  let files;

  beforeEach(async () => {
    files = [
      createMockFile(
        "javascript.md",
        "javascript",
        "JavaScript closures and functions are powerful"
      ),
      createMockFile(
        "js-advanced.md",
        "js-advanced",
        "Advanced JavaScript closures with scope and functions"
      ),
      createMockFile(
        "python.md",
        "python",
        "Python decorators and generators for metaprogramming"
      ),
    ];
    mockApp = createMockApp(files);
    index = new SimilarNotesIndex(mockApp);
    await index.buildIndex();
  });

  it("returns empty array when index not built", () => {
    const emptyIndex = new SimilarNotesIndex(createMockApp([]));
    const result = emptyIndex.findSimilar({ path: "test.md" });

    expect(result).toEqual([]);
  });

  it("returns empty array for non-existent file", () => {
    const result = index.findSimilar({ path: "nonexistent.md" });
    expect(result).toEqual([]);
  });

  it("returns sorted scores (highest first)", () => {
    const result = index.findSimilar(files[0]);

    expect(Array.isArray(result)).toBe(true);
    if (result.length >= 2) {
      expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
    }
  });

  it("excludes self from results", () => {
    const result = index.findSimilar(files[0]);
    const hasSelf = result.some((r) => r.path === files[0].path);

    expect(hasSelf).toBe(false);
  });

  it("returns objects with path, title, and score properties", () => {
    const result = index.findSimilar(files[0]);

    if (result.length > 0) {
      expect(result[0]).toHaveProperty("path");
      expect(result[0]).toHaveProperty("title");
      expect(result[0]).toHaveProperty("score");
      expect(typeof result[0].score).toBe("number");
    }
  });

  it("respects maxResults option", async () => {
    const customIndex = new SimilarNotesIndex(mockApp, { maxResults: 1 });
    await customIndex.buildIndex();

    const result = customIndex.findSimilar(files[0]);
    expect(result.length).toBeLessThanOrEqual(1);
  });

  it("respects minSimilarity option", async () => {
    const customIndex = new SimilarNotesIndex(mockApp, { minSimilarity: 0.9 });
    await customIndex.buildIndex();

    const result = customIndex.findSimilar(files[0]);
    result.forEach((r) => {
      expect(r.score).toBeGreaterThanOrEqual(0.9);
    });
  });

  it("finds javascript notes more similar to each other than to python", () => {
    const jsResult = index.findSimilar(files[0]);

    // The js-advanced note should be more similar than python note
    const jsAdvanced = jsResult.find((r) => r.path === "js-advanced.md");
    const python = jsResult.find((r) => r.path === "python.md");

    if (jsAdvanced && python) {
      expect(jsAdvanced.score).toBeGreaterThan(python.score);
    }
  });
});

/**
 * Obsidian Similar Notes Plugin Tests
 *
 * Validates examples/obsidian-similar-notes.js:
 * - Exports SimilarNotesIndex class
 * - Constructor accepts mock app object
 * - findSimilar() returns sorted scores
 * - getSimilarNotes() returns structured data with percentage
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const SimilarNotesIndex = require("../../examples/obsidian-similar-notes.js");

/**
 * Create a mock Obsidian app object
 */
function createMockApp(files = []) {
  return {
    vault: {
      getMarkdownFiles: vi.fn(() => files),
      read: vi.fn((file) => file.content || ""),
    },
    workspace: {
      getActiveFile: vi.fn(() => files[0] || null),
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

  it("calls vault.getMarkdownFiles on construction", () => {
    const mockApp = createMockApp();
    new SimilarNotesIndex(mockApp);

    expect(mockApp.vault.getMarkdownFiles).toHaveBeenCalled();
  });

  it("accepts custom options", () => {
    const mockApp = createMockApp();
    const options = { maxResults: 10, minSimilarity: 0.2 };
    const index = new SimilarNotesIndex(mockApp, options);

    expect(index.options.maxResults).toBe(10);
    expect(index.options.minSimilarity).toBe(0.2);
  });
});

describe("SimilarNotesIndex.findSimilar()", () => {
  let mockApp;
  let index;
  let files;

  beforeEach(() => {
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
  });

  it("returns empty array when documents not built", () => {
    const emptyApp = createMockApp([]);
    const emptyIndex = new SimilarNotesIndex(emptyApp);
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
    const hasSelf = result.some((r) => r.file.path === files[0].path);

    expect(hasSelf).toBe(false);
  });

  it("respects limit parameter", () => {
    const result = index.findSimilar(files[0], 1);
    expect(result.length).toBeLessThanOrEqual(1);
  });

  it("returns objects with file and score properties", () => {
    const result = index.findSimilar(files[0]);

    if (result.length > 0) {
      expect(result[0]).toHaveProperty("file");
      expect(result[0]).toHaveProperty("score");
      expect(typeof result[0].score).toBe("number");
    }
  });
});

describe("SimilarNotesIndex.getSimilarNotes()", () => {
  let mockApp;
  let index;
  let files;

  beforeEach(() => {
    files = [
      createMockFile(
        "note1.md",
        "note1",
        "JavaScript programming language features"
      ),
      createMockFile(
        "note2.md",
        "note2",
        "JavaScript programming with closures and functions"
      ),
      createMockFile(
        "note3.md",
        "note3",
        "Python programming language features"
      ),
    ];
    mockApp = createMockApp(files);
    index = new SimilarNotesIndex(mockApp);
  });

  it("returns array of structured objects", () => {
    const result = index.getSimilarNotes(files[0]);

    expect(Array.isArray(result)).toBe(true);
  });

  it("returns objects with path, title, similarity, and percentage", () => {
    const result = index.getSimilarNotes(files[0]);

    if (result.length > 0) {
      expect(result[0]).toHaveProperty("path");
      expect(result[0]).toHaveProperty("title");
      expect(result[0]).toHaveProperty("similarity");
      expect(result[0]).toHaveProperty("percentage");
    }
  });

  it("percentage is a rounded integer (0-100)", () => {
    const result = index.getSimilarNotes(files[0]);

    if (result.length > 0) {
      expect(Number.isInteger(result[0].percentage)).toBe(true);
      expect(result[0].percentage).toBeGreaterThanOrEqual(0);
      expect(result[0].percentage).toBeLessThanOrEqual(100);
    }
  });

  it("percentage equals Math.round(similarity * 100)", () => {
    const result = index.getSimilarNotes(files[0]);

    if (result.length > 0) {
      const expected = Math.round(result[0].similarity * 100);
      expect(result[0].percentage).toBe(expected);
    }
  });
});

describe("SimilarNotesIndex.findSimilarForCurrent()", () => {
  it("returns empty array when no active file", () => {
    const mockApp = createMockApp([]);
    mockApp.workspace.getActiveFile = vi.fn(() => null);
    const index = new SimilarNotesIndex(mockApp);

    const result = index.findSimilarForCurrent();
    expect(result).toEqual([]);
  });

  it("calls findSimilar with the active file", () => {
    const files = [
      createMockFile("active.md", "active", "active file content"),
      createMockFile("other.md", "other", "other file content"),
    ];
    const mockApp = createMockApp(files);
    const index = new SimilarNotesIndex(mockApp);

    const spy = vi.spyOn(index, "findSimilar");
    index.findSimilarForCurrent();

    expect(spy).toHaveBeenCalledWith(files[0]);
  });
});

describe("SimilarNotesIndex.buildIndex()", () => {
  it("can be called to rebuild the index", () => {
    const files = [createMockFile("test.md", "test", "test content")];
    const mockApp = createMockApp(files);
    const index = new SimilarNotesIndex(mockApp);

    // Should not throw
    expect(() => index.buildIndex()).not.toThrow();
  });

  it("updates vectors when files change", () => {
    const files = [createMockFile("test.md", "test", "initial content")];
    const mockApp = createMockApp(files);
    const index = new SimilarNotesIndex(mockApp);

    const initialVectors = [...index.vectors];

    // Simulate file content change
    files[0].content = "completely different content now";
    mockApp.vault.read = vi.fn((file) => file.content);
    index.buildIndex();

    // Vectors should be different after rebuild
    expect(index.vectors).not.toEqual(initialVectors);
  });
});

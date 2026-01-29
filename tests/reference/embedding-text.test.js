/**
 * buildEmbeddingText Tests
 *
 * Validates the buildEmbeddingText function:
 * - Combines title and content
 * - Handles missing title or content
 * - Normalizes markdown in content
 * - Respects contentExcerptLength option
 */

import { describe, it, expect } from "vitest";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const quarrel = require("../../index.cjs");

describe("buildEmbeddingText", () => {
  it("combines title and content", () => {
    const result = quarrel.buildEmbeddingText({
      title: "My Note",
      content: "Some content here",
    });
    expect(result).toBe("My Note Some content here");
  });

  it("handles missing title", () => {
    const result = quarrel.buildEmbeddingText({ content: "Just content" });
    expect(result).toBe("Just content");
  });

  it("handles missing content", () => {
    const result = quarrel.buildEmbeddingText({ title: "Just title" });
    expect(result).toBe("Just title");
  });

  it("handles empty document", () => {
    const result = quarrel.buildEmbeddingText({});
    expect(result).toBe("");
  });

  it("normalizes markdown in content", () => {
    const result = quarrel.buildEmbeddingText({
      title: "Note",
      content: "# Header\n\n**Bold** text",
    });
    expect(result).toBe("Note Header Bold text");
  });

  it("strips code blocks from content", () => {
    const result = quarrel.buildEmbeddingText({
      title: "Code",
      content: "Before ```js\nconst x = 1;\n``` After",
    });
    expect(result).toBe("Code Before After");
  });

  it("strips inline code from content", () => {
    const result = quarrel.buildEmbeddingText({
      title: "Inline",
      content: "Use `console.log` for output",
    });
    expect(result).toBe("Inline Use for output");
  });

  it("respects contentExcerptLength option", () => {
    const result = quarrel.buildEmbeddingText(
      { title: "T", content: "A".repeat(100) },
      { contentExcerptLength: 10 }
    );
    // Title "T " (2 chars) + 10 chars from content
    expect(result.length).toBeLessThanOrEqual(12);
    expect(result).toBe("T " + "A".repeat(10));
  });

  it("defaults to 500 char excerpt", () => {
    const longContent = "B".repeat(1000);
    const result = quarrel.buildEmbeddingText({ content: longContent });
    // Should be exactly 500 chars (no title)
    expect(result.length).toBe(500);
    expect(result).toBe("B".repeat(500));
  });

  it("strips frontmatter from content", () => {
    const result = quarrel.buildEmbeddingText({
      title: "Note",
      content: "---\ntitle: ignored\n---\nActual content",
    });
    expect(result).toBe("Note Actual content");
  });

  it("preserves title exactly (no normalization)", () => {
    const result = quarrel.buildEmbeddingText({
      title: "# My **Bold** Title",
      content: "content",
    });
    // Title is preserved as-is, only content is normalized
    expect(result).toBe("# My **Bold** Title content");
  });
});

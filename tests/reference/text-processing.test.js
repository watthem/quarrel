/**
 * Text Processing Tests
 *
 * Validates documented claims from docs/reference.md:
 * - stripFrontmatter (lines 20-25)
 * - normalizeMarkdown (lines 40-42)
 * - tokenize (lines 58-64)
 */

import { describe, it, expect } from "vitest";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const quarrel = require("../../index.cjs");

describe("stripFrontmatter", () => {
  it("removes YAML frontmatter from text (reference.md:20-21)", () => {
    const result = quarrel.stripFrontmatter("---\ntitle: Hello\n---\nBody");
    expect(result).toBe("\nBody");
  });

  it("returns text unchanged when no frontmatter present (reference.md:23-24)", () => {
    const result = quarrel.stripFrontmatter("No frontmatter");
    expect(result).toBe("No frontmatter");
  });

  it("handles empty string", () => {
    expect(quarrel.stripFrontmatter("")).toBe("");
  });

  it("handles text starting with --- but no closing delimiter", () => {
    const result = quarrel.stripFrontmatter("---\nno closing");
    expect(result).toBe("---\nno closing");
  });
});

describe("normalizeMarkdown", () => {
  it("strips markdown syntax leaving plain text (reference.md:40-41)", () => {
    const result = quarrel.normalizeMarkdown(
      "# Title\n\nSome **bold** and [a link](http://x.com)."
    );
    expect(result).toBe("Title Some bold and .");
  });

  it("removes code blocks", () => {
    const result = quarrel.normalizeMarkdown("text\n```js\ncode\n```\nmore");
    expect(result).toBe("text more");
  });

  it("removes inline code", () => {
    const result = quarrel.normalizeMarkdown("use `const` here");
    expect(result).toBe("use here");
  });

  it("removes images", () => {
    const result = quarrel.normalizeMarkdown("![alt](image.png) text");
    expect(result).toBe("text");
  });

  it("removes blockquotes", () => {
    const result = quarrel.normalizeMarkdown("> quoted\nnormal");
    expect(result).toBe("quoted normal");
  });
});

describe("tokenize", () => {
  it("splits text into lowercase words, removing stopwords (reference.md:59-60)", () => {
    const result = quarrel.tokenize(
      "The quick brown fox jumps over the lazy dog"
    );
    expect(result).toEqual(["quick", "brown", "fox", "jumps", "over", "lazy", "dog"]);
  });

  it("respects minTokenLength option (reference.md:62-63)", () => {
    const result = quarrel.tokenize("AI & ML", { minTokenLength: 2 });
    expect(result).toEqual(["ai", "ml"]);
  });

  it("removes punctuation", () => {
    const result = quarrel.tokenize("hello, world! foo-bar");
    expect(result).toEqual(["hello", "world", "foo", "bar"]);
  });

  it("filters stopwords by default", () => {
    const result = quarrel.tokenize("this is a test of the system");
    expect(result).toEqual(["test", "system"]);
  });

  it("accepts custom stopwords", () => {
    const customStopwords = new Set(["custom"]);
    const result = quarrel.tokenize("custom word here", {
      stopwords: customStopwords,
    });
    expect(result).toEqual(["word", "here"]);
  });
});

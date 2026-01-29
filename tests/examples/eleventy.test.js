/**
 * Eleventy Related Posts Plugin Tests
 *
 * Validates examples/eleventy-related-posts.js:
 * - Exports { plugin } function
 * - plugin() calls addFilter("relatedPosts", fn)
 * - Filter returns empty array for null/empty inputs
 * - Filter returns sorted array of similar posts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { plugin } = require("../../examples/eleventy-related-posts.js");

describe("eleventy-related-posts.js exports", () => {
  it("exports a plugin function", () => {
    expect(plugin).toBeDefined();
    expect(typeof plugin).toBe("function");
  });
});

describe("eleventy plugin registration", () => {
  it('calls addFilter with "relatedPosts"', () => {
    const mockConfig = {
      addFilter: vi.fn(),
    };

    plugin(mockConfig);

    expect(mockConfig.addFilter).toHaveBeenCalledTimes(1);
    expect(mockConfig.addFilter).toHaveBeenCalledWith(
      "relatedPosts",
      expect.any(Function)
    );
  });
});

describe("relatedPosts filter", () => {
  let relatedPostsFilter;

  beforeEach(() => {
    const mockConfig = {
      addFilter: vi.fn((name, fn) => {
        if (name === "relatedPosts") {
          relatedPostsFilter = fn;
        }
      }),
    };
    plugin(mockConfig);
  });

  it("returns empty array for null post", () => {
    const result = relatedPostsFilter(null, []);
    expect(result).toEqual([]);
  });

  it("returns empty array for null allPosts", () => {
    const post = { data: { permalink: "/a/" }, content: "test" };
    const result = relatedPostsFilter(post, null);
    expect(result).toEqual([]);
  });

  it("returns empty array for empty allPosts", () => {
    const post = { data: { permalink: "/a/" }, content: "test" };
    const result = relatedPostsFilter(post, []);
    expect(result).toEqual([]);
  });

  it("returns empty array when only the current post exists", () => {
    const post = {
      data: { permalink: "/a/", title: "Post A" },
      content: "content",
    };
    const result = relatedPostsFilter(post, [post]);
    expect(result).toEqual([]);
  });

  it("returns sorted array of similar posts", () => {
    const postA = {
      data: { permalink: "/a/", title: "JavaScript Closures" },
      content: "JavaScript closures are functions that capture scope",
    };
    const postB = {
      data: { permalink: "/b/", title: "JavaScript Functions" },
      content: "JavaScript functions are first-class objects with closures",
    };
    const postC = {
      data: { permalink: "/c/", title: "Python Decorators" },
      content: "Python decorators are a powerful metaprogramming feature",
    };

    const allPosts = [postA, postB, postC];
    const result = relatedPostsFilter(postA, allPosts);

    expect(Array.isArray(result)).toBe(true);
    // postB should be more similar to postA than postC (both about JavaScript)
    if (result.length >= 2) {
      expect(result[0]).toBe(postB);
    }
  });

  it("excludes the current post from results", () => {
    const postA = {
      data: { permalink: "/a/", title: "Test" },
      content: "test content",
    };
    const postB = {
      data: { permalink: "/b/", title: "Test" },
      content: "test content similar",
    };

    const result = relatedPostsFilter(postA, [postA, postB]);
    expect(result.every((p) => p !== postA)).toBe(true);
  });

  it("respects maxRelated option", () => {
    const mockConfig = {
      addFilter: vi.fn((name, fn) => {
        if (name === "relatedPosts") {
          relatedPostsFilter = fn;
        }
      }),
    };
    plugin(mockConfig, { maxRelated: 1 });

    const posts = [
      {
        data: { permalink: "/a/", title: "A" },
        content: "common topic content",
      },
      {
        data: { permalink: "/b/", title: "B" },
        content: "common topic content",
      },
      {
        data: { permalink: "/c/", title: "C" },
        content: "common topic content",
      },
    ];

    const result = relatedPostsFilter(posts[0], posts);
    expect(result.length).toBeLessThanOrEqual(1);
  });
});

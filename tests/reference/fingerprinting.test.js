/**
 * Fingerprinting Tests
 *
 * Validates documented claims from docs/reference.md:
 * - fingerprintText (lines 100-102)
 */

import { describe, it, expect } from "vitest";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const quarrel = require("../../index.cjs");

describe("fingerprintText", () => {
  it('returns "cad44818" for "hello world" (reference.md:101-102)', () => {
    const result = quarrel.fingerprintText("hello world");
    expect(result).toBe("cad44818");
  });

  it("returns an 8-character hex string", () => {
    const result = quarrel.fingerprintText("any text");
    expect(result).toMatch(/^[0-9a-f]{8}$/);
  });

  it("is deterministic: same input produces same output", () => {
    const input = "deterministic test";
    const result1 = quarrel.fingerprintText(input);
    const result2 = quarrel.fingerprintText(input);
    const result3 = quarrel.fingerprintText(input);
    expect(result1).toBe(result2);
    expect(result2).toBe(result3);
  });

  it("different inputs produce different hashes", () => {
    const hash1 = quarrel.fingerprintText("text one");
    const hash2 = quarrel.fingerprintText("text two");
    const hash3 = quarrel.fingerprintText("completely different");
    expect(hash1).not.toBe(hash2);
    expect(hash2).not.toBe(hash3);
    expect(hash1).not.toBe(hash3);
  });

  it("handles empty string", () => {
    const result = quarrel.fingerprintText("");
    expect(result).toMatch(/^[0-9a-f]{8}$/);
  });

  it("handles unicode characters", () => {
    const result = quarrel.fingerprintText("hello 世界");
    expect(result).toMatch(/^[0-9a-f]{8}$/);
  });
});

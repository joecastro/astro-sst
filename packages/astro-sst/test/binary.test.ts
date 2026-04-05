import { describe, expect, it } from "vitest";
import { isBinaryContentType } from "../src/lib/binary";

describe("isBinaryContentType", () => {
  it("detects known binary types", () => {
    expect(isBinaryContentType("image/png")).toBe(true);
    expect(isBinaryContentType("application/pdf")).toBe(true);
  });

  it("ignores content-type parameters", () => {
    expect(isBinaryContentType("image/webp; charset=utf-8")).toBe(true);
  });

  it("returns false for text and missing content types", () => {
    expect(isBinaryContentType("text/html; charset=utf-8")).toBe(false);
    expect(isBinaryContentType(undefined)).toBe(false);
    expect(isBinaryContentType(null)).toBe(false);
  });
});

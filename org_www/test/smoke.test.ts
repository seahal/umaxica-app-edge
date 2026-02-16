import { describe, expect, it } from "vitest";

describe("smoke", () => {
  it("basic truthiness", () => {
    const value = "ok";
    expect(Boolean(value)).toBe(true);
  });
});

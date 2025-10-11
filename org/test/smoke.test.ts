import { describe, expect, it } from "bun:test";

describe("smoke", () => {
	it("basic truthiness", () => {
		const value = "ok";
		expect(Boolean(value)).toBe(true);
	});
});

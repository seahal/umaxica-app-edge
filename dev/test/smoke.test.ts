import { describe, expect, it } from "bun:test";

describe("smoke", () => {
	it("adds numbers", () => {
		expect(1 + 2).toBe(3);
	});
});

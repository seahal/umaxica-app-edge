import { describe, it, expect } from "bun:test";

describe("Sample Test Suite", () => {
	it("should add numbers correctly", () => {
		const sum = 1 + 2;
		expect(sum).toBe(3);
	});

	it("should check truthy value", () => {
		expect(true).toBeTruthy();
	});

	it("should check falsy value", () => {
		expect(false).toBeFalsy();
		expect(null).toBe(null);
	});

	it("should check string equality", () => {
		const str = "Hello, Bun!";
		expect(str).toBe("Hello, Bun!");
	});
});

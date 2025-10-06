import { describe, expect, it } from "bun:test";

describe("smoke", () => {
	it("basic truthiness", () => {
		expect(!!"ok").toBeTrue();
	});
});

import { describe, expect, it } from "vitest";

describe("smoke", () => {
	it("basic truthiness", () => {
		expect(!!"ok").toBeTrue();
	});
});

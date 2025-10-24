import { describe, expect, it } from "bun:test";

import { meta } from "../src/root";

describe("root layout shell", () => {
	it("provides an empty title by default", () => {
		expect(meta({} as never)).toEqual([{ title: "" }]);
	});
});

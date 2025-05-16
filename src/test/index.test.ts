import { describe, expect, it, test } from "bun:test";
import { testClient } from "hono/testing";
import main from "../index";

describe("Shoud see app homepage", () => {
	const client: any = testClient(main);

	it("should add numbers correctly", () => {
		const sum = 1 + 2;
		expect(sum).toBe(3);
	});

	test("GET /app.localdomain:4444/", async () => {
		const res = await client.search.$get({
			query: { q: "" },
		});
		expect(res.status).toBe(404);
	});
});

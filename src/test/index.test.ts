import { describe, expect, it, test } from "bun:test";
import main from "../server/index";

describe("Should see app homepage", () => {
	test("GET /app.localdomain:4444/", async () => {
		const req = new Request("http://app.localdomain:4444/");
		const res = await main.fetch(req);
		expect(res.status).toBe(200);
	});
});

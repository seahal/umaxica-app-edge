import { describe, expect, test } from "bun:test";
import app from "../server/index";

describe("Should see app homepage", () => {
	test("GET /", async () => {
		const res = await app.request("/", {
			headers: {
				host: "app.localdomain:4444",
			},
		});
		expect(res.status).toBe(200);
	});
});

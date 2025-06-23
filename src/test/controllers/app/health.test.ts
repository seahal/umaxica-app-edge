import { describe, expect, it, beforeEach } from "bun:test";
import { Hono } from "hono";
import main from "../../../server/route/app";

describe("Hono Routes Tests", () => {
	// 基本的なルートテスト
	describe("Basic Route Tests", () => {
		it("should respond to GET /health.html", async () => {
			const req = new Request("http://app.localdomain:4000/health.html");
			const res = await main.fetch(req);

			expect(res.status).toBe(200);
			expect(res.headers.get("content-type")).toBe("text/html; charset=UTF-8");
			res.text().then((data) => {
				expect(data).toEqual("<p>OK</p>");
			});
		});

		it("should respond to GET /health.json", async () => {
			const req = new Request("http://app.localdomain:4000/health.json");
			const res = await main.fetch(req);

			expect(res.status).toBe(200);
			expect(res.headers.get("content-type")).toBe("application/json");
			res.json().then((data) => {
				expect(data).toEqual({ status: "OK" });
			});
		});

		it("should return 404 for non-existent route", async () => {
			const req = new Request("http://app.localdomain:4000/non-existent");
			const res = await main.fetch(req);
			expect(res.status).toBe(404);
		});
	});
});

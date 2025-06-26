import { describe, expect, it } from "bun:test";
import app from "../server/index";

describe("Hono Routes Tests", () => {
	// 基本的なルートテスト
	describe("Basic Route Tests", () => {
		it("should respond to GET /", async () => {
			const res = await app.request("/", {
				headers: {
					host: "app.localdomain:4444",
				},
			});
			expect(res.status).toBe(200);
			expect(res.headers.get("content-type")).toBe("text/html; charset=UTF-8");
		});

		it("should return 404 for non-existent route", async () => {
			const res = await app.request("/non-existent", {
				headers: {
					host: "app.localdomain:4444",
				},
			});
			expect(res.status).toBe(404);
		});
	});

	// ドメイン別ルートテスト
	describe("Domain-specific Routes", () => {
		it("should handle app domain", async () => {
			const res = await app.request("/", {
				headers: {
					host: "app.localdomain:4444",
				},
			});
			expect(res.status).toBe(200);
			const text = await res.text();
			expect(text).toContain("app");
		});

		it("should handle com domain", async () => {
			const res = await app.request("/", {
				headers: {
					host: "com.localdomain:4444",
				},
			});
			expect(res.status).toBe(200);
			const text = await res.text();
			expect(text).toContain("com");
		});

		it("should handle org domain", async () => {
			const res = await app.request("/", {
				headers: {
					host: "org.localdomain:4444",
				},
			});
			expect(res.status).toBe(200);
			const text = await res.text();
			expect(text).toContain("org");
		});
	});
});

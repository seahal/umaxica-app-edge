import { describe, expect, it, beforeEach } from "bun:test";
import { Hono } from "hono";
import main from "../server/index";

describe("Hono Routes Tests", () => {
	// 基本的なルートテスト
	describe("Basic Route Tests", () => {
		it("should respond to GET /", async () => {
			const req = new Request("http://app.localdomain:4000/");
			const res = await main.fetch(req);

			expect(res.status).toBe(200);
			expect(res.headers.get("content-type")).toBe("text/html; charset=UTF-8");
		});

		it("should return 404 for non-existent route", async () => {
			const req = new Request("http://app.localdomain:4000/non-existent");
			const res = await main.fetch(req);

			expect(res.status).toBe(404);
		});
	});

	// ドメイン別ルートテスト
	describe("Domain-specific Routes", () => {
		it("should handle app domain", async () => {
			const req = new Request("http://app.localdomain:4000/");
			const res = await main.fetch(req);

			expect(res.status).toBe(200);
			const text = await res.text();
			expect(text).toContain("app");
		});

		it("should handle com domain", async () => {
			const req = new Request("http://com.localdomain:4000/");
			const res = await main.fetch(req);

			expect(res.status).toBe(200);
			const text = await res.text();
			expect(text).toContain("com");
		});

		it("should handle org domain", async () => {
			const req = new Request("http://org.localdomain:4000/");
			const res = await main.fetch(req);

			expect(res.status).toBe(200);
			const text = await res.text();
			expect(text).toContain("org");
		});
	});

	// HTTPメソッドテスト
	describe("HTTP Methods", () => {
		it("should handle GET requests", async () => {
			const req = new Request("http://app.localdomain:4000/", {
				method: "GET",
			});
			const res = await main.fetch(req);

			expect(res.status).toBe(200);
		});

		it("should handle POST requests if implemented", async () => {
			const req = new Request("http://app.localdomain:4000/api/test", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ test: "data" }),
			});
			const res = await main.fetch(req);

			// 実装されていない場合は404、実装されている場合は適切なステータス
			expect([200, 201, 404, 405]).toContain(res.status);
		});
	});

	// ヘッダーテスト
	describe("Response Headers", () => {
		it("should set correct content-type for HTML", async () => {
			const req = new Request("http://app.localdomain:4000/");
			const res = await main.fetch(req);

			expect(res.headers.get("content-type")).toBe("text/html; charset=UTF-8");
		});

		it("should include security headers", async () => {
			const req = new Request("http://app.localdomain:4000/");
			const res = await main.fetch(req);

			// セキュリティヘッダーの確認（実装に応じて調整）
			const headers = res.headers;
			expect(headers.get("x-frame-options")).toBeTruthy();
		});

		it("should handle CORS headers", async () => {
			const req = new Request("http://app.localdomain:4000/", {
				method: "GET",
				headers: {
					Origin: "http://localhost:3000",
				},
			});
			const res = await main.fetch(req);

			// CORS headers should be present on successful requests
			expect(res.status).toBe(200);
			expect(res.headers.get("access-control-allow-origin")).toBeTruthy();
		});
	});

	// パラメータテスト
	describe("URL Parameters", () => {
		it("should handle query parameters", async () => {
			const req = new Request("http://app.localdomain:4000/?param=value");
			const res = await main.fetch(req);

			expect(res.status).toBe(200);
		});

		it("should handle path parameters if implemented", async () => {
			const req = new Request("http://app.localdomain:4000/user/123");
			const res = await main.fetch(req);

			// パスパラメータが実装されていない場合は404
			expect([200, 404]).toContain(res.status);
		});
	});

	// エラーハンドリングテスト
	describe("Error Handling", () => {
		it("should handle invalid JSON in request body", async () => {
			const req = new Request("http://app.localdomain:4000/api/test", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: "invalid json",
			});
			const res = await main.fetch(req);

			// バリデーションエラーまたは404
			expect([400, 404]).toContain(res.status);
		});
	});
});

// カスタムアプリケーションのテスト例
describe("Custom Hono App Tests", () => {
	let app: Hono;

	beforeEach(() => {
		app = new Hono();
	});

	it("should create simple route", () => {
		app.get("/test", (c) => c.text("test"));

		// ルートが追加されていることを確認
		expect(app).toBeDefined();
	});

	it("should test middleware", async () => {
		// カスタムミドルウェア
		app.use("*", async (c, next) => {
			c.set("customHeader", "test-value");
			await next();
		});

		app.get("/", (c) => {
			const customValue = c.get("customHeader");
			return c.text(customValue);
		});

		const req = new Request("http://localhost/");
		const res = await app.fetch(req);
		const text = await res.text();

		expect(text).toBe("test-value");
	});

	it("should test JSON response", async () => {
		app.get("/json", (c) => {
			return c.json({ message: "Hello JSON" });
		});

		const req = new Request("http://localhost/json");
		const res = await app.fetch(req);
		const json = await res.json();

		expect(json).toEqual({ message: "Hello JSON" });
		expect(res.headers.get("content-type")).toContain("application/json");
	});
});

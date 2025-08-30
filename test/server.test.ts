import { describe, expect, it } from "bun:test";

// Minimal route handler without Hono
function handle(req: Request): Response {
	const url = new URL(req.url);
	const path = url.pathname;

	if (path === "/") return new Response("Hello World", { status: 200 });

	if (path === "/json")
		return new Response(JSON.stringify({ message: "Hello JSON" }), {
			status: 200,
			headers: { "content-type": "application/json" },
		});

	const statusMatch = path.match(/^\/status\/(\d{3})$/);
	if (statusMatch) {
		const code = Number(statusMatch[1]);
		return new Response(`Status ${code}`, { status: code });
	}

	return new Response("Not Found", { status: 404 });
}

describe("Server Routes", () => {
	it("should return hello world on root path", async () => {
		const req = new Request("http://localhost/");
		const res = handle(req);

		expect(res.status).toBe(200);
		expect(await res.text()).toBe("Hello World");
	});

	it("should return JSON response", async () => {
		const req = new Request("http://localhost/json");
		const res = handle(req);

		expect(res.status).toBe(200);
		const jsonResponse = (await res.json()) as { message: string };
		expect(jsonResponse).toStrictEqual({ message: "Hello JSON" });
	});

	it("should handle dynamic status codes", async () => {
		const req = new Request("http://localhost/status/404");
		const res = handle(req);

		expect(res.status).toBe(404);
		expect(await res.text()).toBe("Status 404");
	});

	it("should return 404 for unknown routes", async () => {
		const req = new Request("http://localhost/unknown");
		const res = handle(req);

		expect(res.status).toBe(404);
	});
});

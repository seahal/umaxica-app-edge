import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
// Mock route handler for testing
const testApp = new Hono();
testApp.get("/", (c) => {
	return c.text("Hello World");
});
testApp.get("/json", (c) => {
	return c.json({ message: "Hello JSON" });
});
testApp.get("/status/:code", (c) => {
	const code = parseInt(c.req.param("code"));
	return c.text(`Status ${code}`, code);
});
describe("Server Routes", () => {
	it("should return hello world on root path", async () => {
		const req = new Request("http://localhost/");
		const res = await testApp.request(req);
		expect(res.status).toBe(200);
		expect(await res.text()).toBe("Hello World");
	});
	it("should return JSON response", async () => {
		const req = new Request("http://localhost/json");
		const res = await testApp.request(req);
		expect(res.status).toBe(200);
		const jsonResponse = await res.json();
		expect(jsonResponse).toStrictEqual({ message: "Hello JSON" });
	});
	it("should handle dynamic status codes", async () => {
		const req = new Request("http://localhost/status/404");
		const res = await testApp.request(req);
		expect(res.status).toBe(404);
		expect(await res.text()).toBe("Status 404");
	});
	it("should return 404 for unknown routes", async () => {
		const req = new Request("http://localhost/unknown");
		const res = await testApp.request(req);
		expect(res.status).toBe(404);
	});
});

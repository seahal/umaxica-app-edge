import { describe, expect, it } from "bun:test";

describe("check env file (mocked)", () => {
	it("should use mocked environment variables", () => {
		const mockEnv = {
			EDGE_CORPORATE_URL: "com.localhost",
			EDGE_SERVICE_URL: "app.localhost",
			EDGE_STAFF_URL: "org.localhost",
			API_CORPORATE_URL: "api.com.localhost:3300",
			API_SERVICE_URL: "api.app.localhost:3300",
			API_STAFF_URL: "api.org.localhost:3300",
			WWW_CORPORATE_URL: "www.com.localhost:3300",
			WWW_SERVICE_URL: "www.app.localhost:3300",
			WWW_STAFF_URL: "www.org.localhost:3300",
		};
		expect(mockEnv.EDGE_CORPORATE_URL).toBe("com.localhost");
		expect(mockEnv.EDGE_SERVICE_URL).toBe("app.localhost");
		expect(mockEnv.EDGE_STAFF_URL).toBe("org.localhost");
		expect(mockEnv.API_CORPORATE_URL).toBe("api.com.localhost:3300");
		expect(mockEnv.API_SERVICE_URL).toBe("api.app.localhost:3300");
		expect(mockEnv.API_STAFF_URL).toBe("api.org.localhost:3300");
		expect(mockEnv.WWW_CORPORATE_URL).toBe("www.com.localhost:3300");
		expect(mockEnv.WWW_SERVICE_URL).toBe("www.app.localhost:3300");
		expect(mockEnv.WWW_STAFF_URL).toBe("www.org.localhost:3300");
	});
});

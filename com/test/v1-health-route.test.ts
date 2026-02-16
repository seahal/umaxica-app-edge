import { describe, expect, it } from "bun:test";
import { requestFromComApp } from "./utils/request";

describe("GET /v1/health", () => {
  it("returns a JSON health check response", async () => {
    const response = await requestFromComApp("/v1/health");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");

    const body = await response.json();
    expect(body).toEqual({ status: "ok" });
  });

  it("applies security headers to the v1/health response", async () => {
    const response = await requestFromComApp("/v1/health");

    expect(response.headers.get("strict-transport-security")).toContain("max-age=31536000");
    expect(response.headers.get("content-security-policy")).toContain("default-src 'self'");
    expect(response.headers.get("permissions-policy")).toContain("accelerometer=()");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });
});

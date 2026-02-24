import { describe, expect, it } from "vitest";
import { requestFromApp } from "../utils/request";

describe("GET /about", () => {
  it("returns the about HTML document with key metadata", async () => {
    const response = await requestFromApp("/about");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");

    const body = await response.text();

    expect(body).toContain("<title>About - APP</title>");
    expect(body).toContain("<h1>About APP Service</h1>");
    expect(body).toContain("Umaxica App Status Page - APP Service");
  });

  it("applies security headers to the about page", async () => {
    const response = await requestFromApp("/about");

    expect(response.headers.get("permissions-policy")).toContain("camera=()");
    expect(response.headers.get("content-security-policy")).toContain("default-src 'self'");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
  });

  it("includes all required security headers", async () => {
    const response = await requestFromApp("/about");

    expect(response.headers.get("strict-transport-security")).toContain("max-age=31536000");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });

  it("returns valid HTML structure", async () => {
    const response = await requestFromApp("/about");
    const body = await response.text();

    expect(body).toContain("<!DOCTYPE html>");
    expect(body).toContain("<html");
    expect(body).toContain("</html>");
    expect(body).toContain("<head>");
    expect(body).toContain("<body>");
  });
});

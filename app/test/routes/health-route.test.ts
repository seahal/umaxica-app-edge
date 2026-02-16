import { describe, expect, it } from "vitest";
import { requestFromApp } from "../utils/request";

describe("GET /health", () => {
  it("returns OK HTML status page with expected content", async () => {
    const response = await requestFromApp("/health");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");

    const body = await response.text();

    expect(body).toContain("<title>Health Check - APP</title>");
    expect(body).toContain("<p>✓ OK</p>");
    expect(body).toContain("<strong>Timestamp:</strong>");
  });

  it("applies security headers to HTML responses", async () => {
    const response = await requestFromApp("/health");

    expect(response.headers.get("strict-transport-security")).toContain("max-age=31536000");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-xss-protection")).toBe("1; mode=block");
  });

  it("includes valid ISO 8601 timestamp format", async () => {
    const response = await requestFromApp("/health");
    const body = await response.text();

    // Extract timestamp from HTML
    const timestampMatch = body.match(/<strong>Timestamp:<\/strong>\s*([^<]+)/);
    expect(timestampMatch?.[1]).toBeTruthy();

    const timestamp = timestampMatch?.[1];
    if (!timestamp) {
      throw new Error("Timestamp match missing captured value");
    }

    const normalizedTimestamp = timestamp.trim();
    // Validate ISO 8601 format
    expect(normalizedTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    // Verify it's a valid date
    const date = new Date(normalizedTimestamp);
    expect(date.toString()).not.toBe("Invalid Date");
  });

  it("returns valid HTML structure", async () => {
    const response = await requestFromApp("/health");
    const body = await response.text();

    expect(body).toContain("<!DOCTYPE html>");
    expect(body).toContain("<html");
    expect(body).toContain("</html>");
    expect(body).toContain('<meta charset="UTF-8">');
    expect(body).toContain('<meta name="viewport"');
  });

  it("includes all required CSP directives", async () => {
    const response = await requestFromApp("/health");
    const csp = response.headers.get("content-security-policy");

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
  });
});

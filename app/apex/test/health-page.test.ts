import { describe, expect, it } from "vitest";
import { renderHealthPage } from "../src/pages/health-page";

describe("renderHealthPage", () => {
  it("returns HTML with the provided timestamp", () => {
    const timestamp = "2025-01-15T12:34:56.789Z";
    const html = renderHealthPage(timestamp);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>Health Check - APP</title>");
    expect(html).toContain("<p>✓ OK</p>");
    expect(html).toContain(`<strong>Timestamp:</strong> ${timestamp}`);
  });

  it("correctly embeds different timestamp formats", () => {
    const timestamp = "2025-12-31T23:59:59.999Z";
    const html = renderHealthPage(timestamp);

    expect(html).toContain(timestamp);
  });

  it("handles empty timestamp string", () => {
    const html = renderHealthPage("");

    expect(html).toContain("<strong>Timestamp:</strong> ");
  });
});

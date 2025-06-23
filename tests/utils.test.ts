import { describe, it, expect } from "bun:test";

// Example utility functions to test
function add(a: number, b: number): number {
  return a + b;
}

function formatUrl(host: string, path: string): string {
  return `https://${host}${path}`;
}

function extractDomain(url: string): string {
  const match = url.match(/^https?:\/\/([^\/]+)/);
  return match ? match[1] : "";
}

describe("Utility Functions", () => {
  describe("add", () => {
    it("should add two positive numbers", () => {
      expect(add(2, 3)).toBe(5);
    });

    it("should add negative numbers", () => {
      expect(add(-1, -2)).toBe(-3);
    });

    it("should handle zero", () => {
      expect(add(5, 0)).toBe(5);
    });
  });

  describe("formatUrl", () => {
    it("should format URL correctly", () => {
      expect(formatUrl("example.com", "/path")).toBe("https://example.com/path");
    });

    it("should handle root path", () => {
      expect(formatUrl("jp.umaxica.app", "/")).toBe("https://jp.umaxica.app/");
    });
  });

  describe("extractDomain", () => {
    it("should extract domain from https URL", () => {
      expect(extractDomain("https://jp.umaxica.app/path")).toBe("jp.umaxica.app");
    });

    it("should extract domain from http URL", () => {
      expect(extractDomain("http://localhost:4444/test")).toBe("localhost:4444");
    });

    it("should return empty string for invalid URL", () => {
      expect(extractDomain("invalid-url")).toBe("");
    });
  });
});
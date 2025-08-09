import { describe, it, expect } from "bun:test";
// Domain routing logic tests
function getDomainType(host) {
	if (host.includes("umaxica.app") || host.includes("app.localdomain")) {
		return "app";
	}
	if (host.includes("umaxica.com") || host.includes("com.localdomain")) {
		return "com";
	}
	if (host.includes("umaxica.org") || host.includes("org.localdomain")) {
		return "org";
	}
	return "world";
}
function shouldRedirectToJapanese(host) {
	return /^umaxica\.(com|org|app)$/.test(host);
}
function getJapaneseRedirectUrl(host) {
	return `https://jp.${host}/`;
}
describe("Domain Routing Logic", () => {
	describe("getDomainType", () => {
		it("should identify app domain", () => {
			expect(getDomainType("jp.umaxica.app")).toBe("app");
			expect(getDomainType("app.localdomain:4444")).toBe("app");
		});
		it("should identify com domain", () => {
			expect(getDomainType("jp.umaxica.com")).toBe("com");
			expect(getDomainType("com.localdomain:4444")).toBe("com");
		});
		it("should identify org domain", () => {
			expect(getDomainType("jp.umaxica.org")).toBe("org");
			expect(getDomainType("org.localdomain:4444")).toBe("org");
		});
		it("should default to world for unknown domains", () => {
			expect(getDomainType("example.com")).toBe("world");
			expect(getDomainType("localhost")).toBe("world");
		});
	});
	describe("shouldRedirectToJapanese", () => {
		it("should redirect root domains to Japanese", () => {
			expect(shouldRedirectToJapanese("umaxica.com")).toBe(true);
			expect(shouldRedirectToJapanese("umaxica.org")).toBe(true);
			expect(shouldRedirectToJapanese("umaxica.app")).toBe(true);
		});
		it("should not redirect Japanese subdomains", () => {
			expect(shouldRedirectToJapanese("jp.umaxica.com")).toBe(false);
			expect(shouldRedirectToJapanese("jp.umaxica.org")).toBe(false);
			expect(shouldRedirectToJapanese("jp.umaxica.app")).toBe(false);
		});
		it("should not redirect other domains", () => {
			expect(shouldRedirectToJapanese("example.com")).toBe(false);
			expect(shouldRedirectToJapanese("localhost")).toBe(false);
		});
	});
	describe("getJapaneseRedirectUrl", () => {
		it("should generate correct Japanese redirect URLs", () => {
			expect(getJapaneseRedirectUrl("umaxica.com")).toBe(
				"https://jp.umaxica.com/",
			);
			expect(getJapaneseRedirectUrl("umaxica.org")).toBe(
				"https://jp.umaxica.org/",
			);
			expect(getJapaneseRedirectUrl("umaxica.app")).toBe(
				"https://jp.umaxica.app/",
			);
		});
	});
});

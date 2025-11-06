/**
 * Home Route Test (com)
 *
 * Tests for the com domain home route (_index.tsx).
 * This is a concrete example based on the route.test.template.tsx template.
 */

import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CloudflareContext } from "../../src/context";

const { loader, meta, default: Home } = await import("../../src/routes/_index");

function createMockContext(data: {
	cloudflare?: { env?: Record<string, unknown> };
}) {
	const contextMap = new Map();
	contextMap.set(CloudflareContext, data);

	return {
		get: (key: symbol) => contextMap.get(key),
	};
}

describe("Route: Home (com)", () => {
	describe("Meta", () => {
		it("should return localized title and description", () => {
			const result = meta({} as never);
			expect(result).toEqual([
				{ title: "Umaxica Commerce - Abstract Experience Sample" },
				{
					name: "description",
					content:
						"抽象的なバリュープロポジションで魅せるコーポレートサイトのサンプル。",
				},
			]);
		});
	});

	describe("Loader", () => {
		it("should return message from Cloudflare env", () => {
			const mockContext = createMockContext({
				cloudflare: {
					env: {
						VALUE_FROM_CLOUDFLARE: "Test Message",
					},
				},
			});

			const result = loader({
				context: mockContext,
			} as never);

			expect(result).toEqual({ message: "Test Message" });
		});

		it("should handle missing Cloudflare context", () => {
			// Don't set CloudflareContext at all
			const contextMap = new Map();
			const mockContext = {
				get: (key: symbol) => contextMap.get(key),
			};

			const result = loader({
				context: mockContext,
			} as never);

			expect(result).toEqual({ message: "" });
		});

		it("should handle missing env variables", () => {
			const mockContext = createMockContext({
				cloudflare: {
					env: {},
				},
			});

			const result = loader({
				context: mockContext,
			} as never);

			expect(result).toEqual({ message: "" });
		});

		it("should handle undefined cloudflare object", () => {
			const mockContext = createMockContext({
				cloudflare: undefined,
			});

			const result = loader({
				context: mockContext,
			} as never);

			expect(result).toEqual({ message: "" });
		});
	});

	describe("Component", () => {
		it("should render the abstract corporate hero", () => {
			const markup = renderToStaticMarkup(
				<Home loaderData={{ message: "Edge Blueprint" }} />,
			);

			expect(markup).toContain("Abstract Corporate Sample");
			expect(markup).toContain("Edge Blueprint");
			expect(markup).toContain("プロジェクトを描写する");
		});

		it("should render focus areas and perspectives", () => {
			const markup = renderToStaticMarkup(
				<Home loaderData={{ message: "Hello" }} />,
			);

			expect(markup).toContain("Modular Platform");
			expect(markup).toContain("Experience Studio");
			expect(markup).toContain("Vision");
			expect(markup).toContain("静かな変革を、そっと始めませんか。");
		});

		it("should handle empty message", () => {
			const markup = renderToStaticMarkup(
				<Home loaderData={{ message: "" }} />,
			);

			expect(markup).toBeDefined();
			expect(markup.length).toBeGreaterThan(0);
			expect(markup).toContain("Sculpting Calm &amp; Capable Experiences");
		});
	});
});

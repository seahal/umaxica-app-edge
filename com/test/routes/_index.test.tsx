/**
 * Home Route Test (com)
 *
 * Tests for the com domain home route (_index.tsx).
 * This is a concrete example based on the route.test.template.tsx template.
 */

import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const { loader, meta, default: Home } = await import("../../src/routes/_index");

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
			const result = loader({
				context: {
					cloudflare: {
						env: {
							VALUE_FROM_CLOUDFLARE: "Test Message",
						},
					},
				},
			} as never);

			expect(result).toEqual({ message: "Test Message" });
		});

		it("should handle missing Cloudflare context", () => {
			const result = loader({
				context: {},
			} as never);

			expect(result).toEqual({ message: undefined });
		});

		it("should handle missing env variables", () => {
			const result = loader({
				context: {
					cloudflare: {
						env: {},
					},
				},
			} as never);

			expect(result).toEqual({ message: undefined });
		});

		it("should handle undefined cloudflare object", () => {
			const result = loader({
				context: {
					cloudflare: undefined,
				},
			} as never);

			expect(result).toEqual({ message: undefined });
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

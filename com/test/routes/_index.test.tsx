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
				{ title: "Umaxica Commerce - 商品カタログ" },
				{ name: "description", content: "最適なプランを見つけましょう" },
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
		it("should render the product catalog shell", () => {
			const markup = renderToStaticMarkup(
				<Home loaderData={{ message: "unused" }} />,
			);

			expect(markup).toContain("商品カタログ");
		});

		it("should render product offerings", () => {
			const markup = renderToStaticMarkup(
				<Home loaderData={{ message: "Hello" }} />,
			);

			expect(markup).toContain("プレミアムプラン");
			expect(markup).toContain("スタンダードプラン");
			expect(markup).toContain("ベーシックプラン");
		});

		it("should handle empty message", () => {
			const markup = renderToStaticMarkup(
				<Home loaderData={{ message: "" }} />,
			);

			expect(markup).toBeDefined();
			expect(markup.length).toBeGreaterThan(0);
		});
	});
});

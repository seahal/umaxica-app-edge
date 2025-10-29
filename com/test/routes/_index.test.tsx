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
		it("should return correct meta description", () => {
			const result = meta({} as never);
			expect(result).toEqual([{ name: "description", content: "Welcome!" }]);
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
		it("should render Home component with loaderData", () => {
			const testMessage = "Test message from loader";
			const markup = renderToStaticMarkup(
				<Home loaderData={{ message: testMessage }} />,
			);

			expect(markup).toContain(testMessage);
		});

		it("should render Welcome component", () => {
			const markup = renderToStaticMarkup(
				<Home loaderData={{ message: "Hello" }} />,
			);

			// Welcome component renders a main element
			expect(markup).toContain("<main");
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

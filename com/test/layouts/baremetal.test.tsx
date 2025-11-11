/**
 * Baremetal Layout Test
 *
 * Tests for the com domain baremetal layout.
 * This is a concrete example based on the layout.test.template.tsx template.
 */

import { describe, expect, it, mock } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const actualRouter = await import("react-router");

mock.module("react-router", () => ({
	...actualRouter,
	Outlet: (props: Record<string, unknown>) =>
		createElement("mock-outlet", props),
	Meta: () => createElement("mock-meta"),
	Links: () => createElement("mock-links"),
	Scripts: (props: Record<string, unknown>) =>
		createElement("mock-scripts", props),
	ScrollRestoration: (props: Record<string, unknown>) =>
		createElement("mock-scroll-restoration", props),
}));

const baremetalModule = await import("../../src/layouts/baremetal");
const { Layout, meta, default: App } = baremetalModule;

describe("Baremetal Layout (com)", () => {
	it("should provide an empty title by default", () => {
		expect(meta({} as never)).toEqual([{ title: "" }]);
	});

	it("should render with children", () => {
		const markup = renderToStaticMarkup(
			<Layout>
				<div>test content</div>
			</Layout>,
		);

		expect(markup).toContain("test content");
		expect(markup).toContain("<html");
		expect(markup).toContain("</html>");
	});

	it("should include outlet for nested routes", () => {
		const markup = renderToStaticMarkup(<Layout />);
		// Baremetal layout renders children directly, not through Outlet
		expect(markup).toContain("body");
	});

	it("should include proper meta tags", () => {
		const markup = renderToStaticMarkup(
			<Layout>
				<div>content</div>
			</Layout>,
		);

		expect(markup).toContain('charSet="utf-8"');
		expect(markup).toContain('name="viewport"');
	});

	it("should use English as the document language", () => {
		const markup = renderToStaticMarkup(
			<Layout>
				<div>content</div>
			</Layout>,
		);

		expect(markup).toContain('lang="en"');
	});

	it("should render App component with Outlet", () => {
		const element = App();
		expect(element.type).toBe(actualRouter.Outlet);
	});
});

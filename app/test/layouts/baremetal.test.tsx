import { afterAll, describe, expect, it, mock } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const actualRouter = await import("react-router");

mock.module("react-router", () => ({
	...actualRouter,
	Links: (props: Record<string, unknown>) => createElement("mock-links", props),
	Meta: (props: Record<string, unknown>) => createElement("mock-meta", props),
	ScrollRestoration: (props: Record<string, unknown>) =>
		createElement("mock-scroll", props),
	Scripts: (props: Record<string, unknown>) =>
		createElement("mock-scripts", props),
}));

const layoutModule = await import("../../src/layouts/baremetal");
const { Layout, meta, default: App } = layoutModule;

afterAll(() => {
	mock.module("react-router", () => actualRouter);
});

describe("baremetal layout", () => {
	it("provides default meta title", () => {
		expect(meta({} as never)).toEqual([{ title: "" }]);
	});

	it("renders html skeleton with router primitives", () => {
		const html = renderToStaticMarkup(
			<Layout>
				<div>content</div>
			</Layout>,
		);

		expect(html).toContain('<html lang="ja">');
		expect(html).toContain("<mock-meta");
		expect(html).toContain("<mock-links");
		expect(html).toContain("<mock-scroll");
		expect(html).toContain("<mock-scripts");
		expect(html).toContain("content");
	});

	it("returns an outlet placeholder", () => {
		const element = App();
		expect(element.type).toBe(actualRouter.Outlet);
	});
});

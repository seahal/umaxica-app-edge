import { afterAll, describe, expect, it, mock } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

type RootModule = typeof import("../src/root");
type LoaderData = Awaited<ReturnType<RootModule["loader"]>>;

const actualRouter = await import("react-router");

let loaderDataOverride: LoaderData | undefined;

mock.module("react-router", () => ({
	...actualRouter,
	Links: (props: Record<string, unknown>) => createElement("mock-links", props),
	Meta: (props: Record<string, unknown>) => createElement("mock-meta", props),
	ScrollRestoration: (props: Record<string, unknown>) =>
		createElement("mock-scroll", props),
	Scripts: (props: Record<string, unknown>) =>
		createElement("mock-scripts", props),
	useLoaderData: () => {
		if (!loaderDataOverride) {
			throw new Error("loader data override not set");
		}
		return loaderDataOverride;
	},
}));

const rootModule = await import("../src/root");
const { default: App, Layout, meta } = rootModule;

const baseLoaderData: LoaderData = {
	codeName: "",
	helpServiceUrl: "",
	docsServiceUrl: "",
	newsServiceUrl: "",
	apiServiceUrl: "",
	apexServiceUrl: "",
	edgeServiceUrl: "",
	cspNonce: "",
};

function renderLayoutWithData(data: Partial<LoaderData> = {}) {
	loaderDataOverride = { ...baseLoaderData, ...data };
	const markup = renderToStaticMarkup(
		<Layout>
			<div>child route</div>
		</Layout>,
	);
	loaderDataOverride = undefined;
	return markup;
}

afterAll(() => {
	loaderDataOverride = undefined;
	mock.module("react-router", () => actualRouter);
});

describe("root layout shell", () => {
	it("provides an empty title by default", () => {
		expect(meta({} as never)).toEqual([{ title: "" }]);
	});

	it("renders the html shell with child content", () => {
		const markup = renderLayoutWithData({ cspNonce: "nonce-123" });

		expect(markup).toContain("<mock-links");
		expect(markup).toContain("<mock-meta");
		expect(markup).toContain('<mock-scroll nonce="nonce-123"');
		expect(markup).toContain('<mock-scripts nonce="nonce-123"');
		expect(markup).toContain("child route");
	});

	it("omits nonce attributes when loader data has no nonce", () => {
		const markup = renderLayoutWithData({ cspNonce: "" });

		expect(markup).not.toContain('nonce=""');
	});
});

describe("root route component", () => {
	it("renders an outlet placeholder for nested routes", () => {
		loaderDataOverride = baseLoaderData;
		const element = App();
		loaderDataOverride = undefined;

		expect(element.type).toBe(actualRouter.Outlet);
	});
});

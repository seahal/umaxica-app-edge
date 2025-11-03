import { afterAll, describe, expect, it, mock } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

type RootModule = typeof import("../src/root");
type LoaderData = Awaited<ReturnType<RootModule["loader"]>>;

const actualRouter = await import("react-router");

let loaderDataOverride: LoaderData | undefined;
let errorResponsePredicate: ((error: unknown) => boolean) | undefined;

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
	isRouteErrorResponse: (error: unknown) =>
		errorResponsePredicate?.(error) ?? false,
}));

const rootModule = await import("../src/root");
const { default: App, Layout, links, ErrorBoundary } = rootModule;

const baseLoaderData: LoaderData = {
	codeName: "",
	helpServiceUrl: "",
	docsServiceUrl: "",
	newsServiceUrl: "",
	cspNonce: "nonce-abc",
};

function renderLayout(data: Partial<LoaderData> = {}) {
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
	mock.module("react-router", () => actualRouter);
});

describe("dev root layout shell", () => {
	it("declares external font preload and stylesheet links", () => {
		const linkDescriptors = links();

		expect(linkDescriptors).toEqual([
			{ rel: "preconnect", href: "https://fonts.googleapis.com" },
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			expect.objectContaining({
				rel: "stylesheet",
				href: expect.stringContaining("fonts.googleapis.com"),
			}),
		]);
	});

	it("renders root html structure and propagates csp nonce", () => {
		const markup = renderLayout();

		expect(markup).toContain("<mock-links");
		expect(markup).toContain("<mock-meta");
		expect(markup).toContain('<mock-scroll nonce="nonce-abc"');
		expect(markup).toContain('<mock-scripts nonce="nonce-abc"');
		expect(markup).toContain("child route");
	});

	it("omits nonce attributes when loader data does not include it", () => {
		const markup = renderLayout({ cspNonce: "" });

		expect(markup).not.toContain('nonce=""');
	});
});

describe("dev root route component", () => {
	it("renders an outlet placeholder", () => {
		const element = App();
		expect(element.type).toBe(actualRouter.Outlet);
	});
});

describe("dev root error boundary", () => {
	it("renders 404 friendly message for missing pages", () => {
		errorResponsePredicate = (error) =>
			(error as { status?: number })?.status === 404;
		const markup = renderToStaticMarkup(
			<ErrorBoundary error={{ status: 404, statusText: "Not Found" }} />,
		);
		errorResponsePredicate = undefined;

		expect(markup).toContain("404");
		expect(markup).toContain("The requested page could not be found.");
	});

	it("falls back to generic status text for other route errors", () => {
		errorResponsePredicate = (error) =>
			Boolean((error as { status?: number })?.status);
		const markup = renderToStaticMarkup(
			<ErrorBoundary error={{ status: 500, statusText: "Server Error" }} />,
		);
		errorResponsePredicate = undefined;

		expect(markup).toContain("Error");
		expect(markup).toContain("Server Error");
	});

	it("shows developer stack traces when provided an Error instance", () => {
		errorResponsePredicate = () => false;
		const error = new Error("Boom");
		error.stack = "STACK";
		const markup = renderToStaticMarkup(<ErrorBoundary error={error} />);
		errorResponsePredicate = undefined;

		expect(markup).toContain("Oops!");
		expect(markup).toContain("An unexpected error occurred.");
	});
});

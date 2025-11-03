import { afterAll, afterEach, describe, expect, it, mock } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

type LoaderData = {
	codeName: string;
	helpServiceUrl: string;
	docsServiceUrl: string;
	newsServiceUrl: string;
};

const actualRouter = await import("react-router");

let loaderData: LoaderData = {
	codeName: "Umaxica Dev",
	helpServiceUrl: "help.dev.example.com",
	docsServiceUrl: "docs.dev.example.com",
	newsServiceUrl: "news.dev.example.com",
};

mock.module("react-router", () => ({
	...actualRouter,
	useRouteLoaderData: () => loaderData,
	Outlet: (props: Record<string, unknown>) =>
		createElement("mock-outlet", props),
}));

let headerCalls: unknown[] = [];
let footerCalls: unknown[] = [];

mock.module("../../src/components/Header", () => ({
	Header: (props: Record<string, unknown>) => {
		headerCalls.push(props);
		return createElement("mock-header", props);
	},
}));

mock.module("../../src/components/Footer", () => ({
	Footer: (props: Record<string, unknown>) => {
		footerCalls.push(props);
		return createElement("mock-footer", props);
	},
}));

const layoutModule = await import("../../src/layouts/decorated");
const DecoratedLayout = layoutModule.default;

afterEach(() => {
	headerCalls = [];
	footerCalls = [];
});

afterAll(async () => {
	const actualHeader = await import("../../src/components/Header");
	const actualFooter = await import("../../src/components/Footer");
	mock.module("../../src/components/Header", () => actualHeader);
	mock.module("../../src/components/Footer", () => actualFooter);
	mock.module("react-router", () => actualRouter);
});

describe("dev decorated layout", () => {
	it("passes loader data into header and footer components", () => {
		renderToStaticMarkup(<DecoratedLayout />);

		expect(headerCalls).toHaveLength(1);
		expect(headerCalls[0]).toMatchObject({
			codeName: "Umaxica Dev",
			helpServiceUrl: "help.dev.example.com",
			docsServiceUrl: "docs.dev.example.com",
			newsServiceUrl: "news.dev.example.com",
		});

		expect(footerCalls).toHaveLength(1);
		expect(footerCalls[0]).toMatchObject({
			codeName: "Umaxica Dev",
		});
	});

	it("renders outlet for nested routes", () => {
		const markup = renderToStaticMarkup(<DecoratedLayout />);

		expect(markup).toContain("<mock-outlet");
	});

	it("handles missing loader data gracefully", () => {
		loaderData = {
			codeName: "",
			helpServiceUrl: "",
			docsServiceUrl: "",
			newsServiceUrl: "",
		};

		const markup = renderToStaticMarkup(<DecoratedLayout />);

		expect(headerCalls[0]).toMatchObject({
			codeName: "",
			helpServiceUrl: "",
			docsServiceUrl: "",
			newsServiceUrl: "",
		});
		expect(footerCalls[0]).toMatchObject({ codeName: "" });
		expect(markup).toContain("<mock-outlet");

		loaderData = {
			codeName: "Umaxica Dev",
			helpServiceUrl: "help.dev.example.com",
			docsServiceUrl: "docs.dev.example.com",
			newsServiceUrl: "news.dev.example.com",
		};
	});
});

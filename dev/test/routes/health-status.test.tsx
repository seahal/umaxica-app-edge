import {
	afterAll,
	afterEach,
	describe,
	expect,
	it,
	mock,
} from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

type LoaderArgs = Parameters<
	typeof import("../../src/routes/healths/_index")["loader"]
>[0];

const actualRouter = await import("react-router");

let loaderData: Awaited<
	ReturnType<typeof import("../../src/routes/healths/_index")["loader"]>
>;

mock.module("react-router", () => ({
	...actualRouter,
	useLoaderData: () => loaderData,
}));

const createPassthrough =
	(tag: string) =>
	({
		children,
		...props
	}: {
		children?: React.ReactNode;
		[key: string]: unknown;
	}) =>
		createElement(tag, props, children);

mock.module("react-aria-components", () => ({
	Tabs: createPassthrough("mock-tabs"),
	TabList: createPassthrough("mock-tablist"),
	Tab: createPassthrough("mock-tab"),
	TabPanel: createPassthrough("mock-tabpanel"),
	Table: createPassthrough("mock-table"),
	TableHeader: createPassthrough("mock-table-header"),
	Column: createPassthrough("mock-column"),
	TableBody: ({
		items,
		children,
		...props
	}: {
		items: unknown[];
		children: (item: unknown) => React.ReactNode;
		[key: string]: unknown;
	}) => {
		const rendered =
			typeof children === "function"
				? (items ?? []).map((item) => children(item))
				: children;
		return createElement("mock-table-body", props, rendered);
	},
	Row: createPassthrough("mock-row"),
	Cell: createPassthrough("mock-cell"),
}));

const module = await import("../../src/routes/healths/_index");
const { loader, default: HealthStatusRoute } = module;

function runLoader(context: LoaderArgs["context"]) {
	return loader({ context } as LoaderArgs);
}

loaderData = runLoader({ cloudflare: { env: {} } });

afterEach(() => {
	// Reset loader data between component tests
	loaderData = runLoader({ cloudflare: { env: {} } });
});

afterAll(() => {
	mock.module("react-router", () => actualRouter);
});

describe("dev health route loader", () => {
	it("hydrates notice from Cloudflare environment variables", () => {
		const result = runLoader({
			cloudflare: {
				env: {
					STATUS_NOTICE: "  Planned maintenance tonight  ",
				},
			},
		});

		expect(result.notice).toBe("Planned maintenance tonight");
		expect(result.services.length).toBeGreaterThan(0);
		expect(result.history.length).toBeGreaterThan(0);
	});

	it("omits notice when only whitespace is provided", () => {
		const result = runLoader({
			cloudflare: {
				env: {
					STATUS_NOTICE: "   ",
				},
			},
		});

		expect(result.notice).toBeNull();
	});
});

describe("dev health route component", () => {
	it("renders overall status and service list", () => {
		loaderData = runLoader({
			cloudflare: { env: { STATUS_NOTICE: "Service updates" } },
		});

		const markup = renderToStaticMarkup(<HealthStatusRoute />);

		expect(markup).toContain("サービス稼働状況");
		expect(markup).toContain("Webhook 配信の遅延を監視しています。");
		expect(markup).toContain("Edge API");
		expect(markup).toContain("Service updates");
	});

	it("omits notice block when loader data has no notice", () => {
		loaderData = runLoader({ cloudflare: { env: {} } });

		const markup = renderToStaticMarkup(<HealthStatusRoute />);

		expect(markup).not.toContain("お知らせ:");
	});
});

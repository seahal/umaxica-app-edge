import { afterAll, describe, expect, it, mock } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

const actualRouter = await import("react-router");
mock.module("react-router", () => ({
	...actualRouter,
	Link: ({ to, children }: { to: string; children: React.ReactNode }) =>
		createElement("a", { href: to }, children),
	NavLink: ({
		to,
		children,
		className,
	}: {
		to: string;
		children: React.ReactNode;
		className?: string | ((args: { isActive: boolean }) => string | undefined);
	}) => {
		const resolvedClassName =
			typeof className === "function"
				? className({ isActive: false })
				: className;
		return createElement(
			"a",
			{
				href: to,
				className: resolvedClassName,
				"data-mock": "nav-link",
			},
			children,
		);
	},
}));

const { Header } = await import("../../src/components/Header");

afterAll(() => {
	mock.module("react-router", () => actualRouter);
});

function render(component: React.ReactElement) {
	return renderToStaticMarkup(component);
}

describe("dev Header component", () => {
	it("shows default brand name when none is provided", () => {
		const markup = render(<Header />);
		expect(markup).toContain("Umaxica");
	});

	it("renders provided branding", () => {
		const markup = render(<Header codeName="Dev Console" />);
		expect(markup).toContain("Dev Console");
	});

	it("renders internal navigation links", () => {
		const markup = render(<Header />);
		expect(markup).toContain('href="/message"');
		expect(markup).toContain('href="/notification"');
		expect(markup).toContain('href="/configuration"');
		expect(markup).toContain("💬");
		expect(markup).toContain("🔔");
		expect(markup).toContain("⚙️");
	});

	it("includes optional external links when URLs are passed", () => {
		const markup = render(
			<Header
				newsServiceUrl="news.dev.example.com"
				docsServiceUrl="docs.dev.example.com"
				helpServiceUrl="help.dev.example.com"
			/>,
		);

		expect(markup).toContain("https://news.dev.example.com");
		expect(markup).toContain("https://docs.dev.example.com");
		expect(markup).toContain("https://help.dev.example.com");
	});

	it("omits optional external links by default", () => {
		const markup = render(<Header />);
		expect(markup).not.toContain("https://");
	});
});

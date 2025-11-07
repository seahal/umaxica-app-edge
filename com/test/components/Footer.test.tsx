import "../../test-setup.ts";

import { afterAll, describe, expect, it, mock } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const actualAriaComponents = await import("react-aria-components");

mock.module("react-aria-components", () => ({
	...actualAriaComponents,
	Link: ({
		href,
		children,
		...rest
	}: {
		href: string;
		children: React.ReactNode;
		[key: string]: unknown;
	}) => (
		<a href={href} {...rest}>
			{children}
		</a>
	),
	TooltipTrigger: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
	Tooltip: ({ children }: { children: React.ReactNode }) => (
		<span>{children}</span>
	),
}));

const { Footer } = await import("../../src/components/Footer");

afterAll(() => {
	mock.module("react-aria-components", () => actualAriaComponents);
});

describe("Footer component (com)", () => {
	it("falls back to placeholder branding when code name is absent", () => {
		const markup = renderToStaticMarkup(<Footer />);

		expect(markup).toContain("???");
		expect(markup).toContain(new Date().getFullYear().toString());
	});

	it("renders provided code name and quick links", () => {
		const markup = renderToStaticMarkup(<Footer codeName="Commerce Hub" />);

		expect(markup).toContain("Commerce Hub");
		expect(markup).toContain('href="/"');
		expect(markup).toContain(
			'href="https://jp.help.umaxica.com/contacts/new"',
		);
		expect(markup).not.toContain('href="/about"');
	});

	it("exposes social links with security attributes", () => {
		const markup = renderToStaticMarkup(<Footer codeName="Commerce Hub" />);

		expect(markup).toContain(
			'href="https://github.com/seahal/umaxica-app-edge"',
		);
		expect(markup).toContain('href="https://x.com/umaxica"');
		expect(markup).toContain('target="_blank"');
		expect(markup).toContain('rel="noopener noreferrer"');
	});
});

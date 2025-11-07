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

describe("Footer component (org)", () => {
	it("falls back to a placeholder brand when no code name is provided", () => {
		const markup = renderToStaticMarkup(<Footer />);

		expect(markup).toContain("???");
		expect(markup).toContain(new Date().getFullYear().toString());
	});

	it("renders supplied code name and quick links", () => {
		const markup = renderToStaticMarkup(<Footer codeName="Org Hub" />);

		expect(markup).toContain("Org Hub");
		expect(markup).toContain('href="/"');
		expect(markup).toContain(
			'href="https://jp.help.umaxica.org/contacts/new"',
		);
		expect(markup).toContain('href="https://jp.docs.umaxica.org/privacy"');
		expect(markup).not.toContain('href="/about"');
	});

	it("exposes the GitHub link with safe target attributes", () => {
		const markup = renderToStaticMarkup(<Footer codeName="Org Hub" />);

		expect(markup).toContain(
			'href="https://github.com/seahal/umaxica-app-edge"',
		);
		expect(markup).toContain('target="_blank"');
		expect(markup).toContain('rel="noopener noreferrer"');
	});
});

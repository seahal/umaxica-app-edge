/**
 * Header Component Test
 *
 * Tests for the com domain Header component.
 * This is a concrete example based on the component.test.template.tsx template.
 */

import { describe, expect, it, mock } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

// Mock React Router components
const actualRouterDom = await import("react-router-dom");
mock.module("react-router-dom", () => ({
	...actualRouterDom,
	Link: ({ to, children }: { to: string; children: React.ReactNode }) =>
		createElement("a", { href: to }, children),
	NavLink: ({ to, children }: { to: string; children: React.ReactNode }) =>
		createElement("a", { href: to, className: "nav-link" }, children),
}));

const { Header } = await import("../../src/components/Header");

function renderComponent(component: React.ReactElement) {
	return renderToStaticMarkup(component);
}

describe("Header Component (com)", () => {
	it("should render without crashing", () => {
		const markup = renderComponent(<Header />);
		expect(markup).toContain("header");
	});

	it("should display the code name", () => {
		const markup = renderComponent(<Header codeName="Test Project" />);
		expect(markup).toContain("Test Project");
		expect(markup).toContain("(Com)");
	});

	it("should render navigation links", () => {
		const markup = renderComponent(<Header />);
		expect(markup).toContain("Configure");
		expect(markup).toContain("News");
		expect(markup).toContain("Docs");
		expect(markup).toContain("Help");
	});

	it("should use provided URLs for external links", () => {
		const markup = renderComponent(
			<Header
				newsUrl="news.example.com"
				docsUrl="docs.example.com"
				helpUrl="help.example.com"
			/>,
		);

		expect(markup).toContain("https://news.example.com");
		expect(markup).toContain("https://docs.example.com");
		expect(markup).toContain("https://help.example.com");
	});

	it("should use # for empty URLs", () => {
		const markup = renderComponent(<Header />);
		expect(markup).toContain('href="#"');
	});

	it("should include security attributes for external links", () => {
		const markup = renderComponent(<Header newsUrl="news.example.com" />);
		expect(markup).toContain('target="_blank"');
		expect(markup).toContain('rel="noopener noreferrer"');
	});
});

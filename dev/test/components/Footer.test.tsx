import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const { Footer } = await import("../../src/components/Footer");

const render = (node: React.ReactElement) => renderToStaticMarkup(node);

describe("dev Footer component", () => {
	it("falls back to placeholder brand when no code name is provided", () => {
		const markup = render(<Footer />);
		expect(markup).toContain("???");
	});

	it("displays provided code name", () => {
		const markup = render(<Footer codeName="Umaxica Dev" />);
		expect(markup).toContain("Umaxica Dev");
	});

	it("renders quick links with expected hrefs", () => {
		const markup = render(<Footer />);
		expect(markup).toContain('href="/"');
		expect(markup).toContain('href="/about"');
		expect(markup).toContain('href="/contact"');
	});

	it("includes social github link with security attributes", () => {
		const markup = render(<Footer codeName="Dev Hub" />);
		expect(markup).toContain("https://github.com/seahal/umaxica-app-edge");
		expect(markup).toContain('target="_blank"');
		expect(markup).toContain('rel="noopener noreferrer"');
	});

	it("shows current year to keep copyright fresh", () => {
		const markup = render(<Footer />);
		expect(markup).toContain(new Date().getFullYear().toString());
	});
});

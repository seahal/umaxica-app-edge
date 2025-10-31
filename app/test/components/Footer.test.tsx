import "@testing-library/jest-dom/vitest";

import { afterEach, describe, expect, it } from "bun:test";

import { Footer } from "../../src/components/Footer";

await import(new URL("../../../test/setup-happy-dom.ts", import.meta.url).href);

const { cleanup, render, screen, within } = await import(
	"@testing-library/react"
);

afterEach(() => {
	cleanup();
});

function renderFooter(props?: Partial<Parameters<typeof Footer>[0]>) {
	render(<Footer {...(props as Parameters<typeof Footer>[0])} />);
}

describe("Footer component", () => {
	it("renders a footer landmark with fallback branding when codeName is omitted", () => {
		renderFooter();

		expect(screen.getByRole("contentinfo")).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { level: 3, name: "???" }),
		).toBeInTheDocument();

		const currentYear = new Date().getFullYear();
		const copyright = screen.getByText((content) =>
			content.includes("All rights reserved."),
		);

		expect(copyright).toHaveTextContent(
			`© ${currentYear} Umaxica. All rights reserved.`,
		);
	});

	it("renders provided codeName in branding and copyright notice", () => {
		const codeName = "Stardust";

		renderFooter({ codeName });

		expect(
			screen.getByRole("heading", { level: 3, name: codeName }),
		).toBeInTheDocument();

		const currentYear = new Date().getFullYear();
		expect(
			screen.getByText(`© ${currentYear} ${codeName}. All rights reserved.`),
		).toBeInTheDocument();
	});

	it("renders quick links with expected routes", () => {
		renderFooter();

		const nav = screen.getByRole("navigation");
		const quickLinks = within(nav).getAllByRole("link");
		expect(quickLinks).toHaveLength(3);

		expect(screen.getByRole("link", { name: "ホーム" })).toHaveAttribute(
			"href",
			"/",
		);
		expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
			"href",
			"/about",
		);
		expect(screen.getByRole("link", { name: "お問い合わせ" })).toHaveAttribute(
			"href",
			"/contact",
		);
	});

	it("renders social links that open externally with descriptive labels", () => {
		renderFooter();

		const socialLinks: Array<[string, string]> = [
			["GitHub", "https://github.com/seahal/umaxica-app-edge"],
			["Twitter", "https://twitter.com"],
		];

		for (const [name, href] of socialLinks) {
			const link = screen.getByRole("link", { name });
			expect(link).toHaveAttribute("href", href);
			expect(link).toHaveAttribute("target", "_blank");
			expect(link).toHaveAttribute("rel", "noopener noreferrer");
		}
	});

	it("includes privacy and terms legal links", () => {
		renderFooter();

		expect(
			screen.getByRole("link", { name: "プライバシーポリシー" }),
		).toHaveAttribute("href", "/privacy");
		expect(screen.getByRole("link", { name: "利用規約" })).toHaveAttribute(
			"href",
			"/terms",
		);
	});
});

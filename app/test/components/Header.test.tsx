import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { Header } from "../../src/components/Header";

await import("../../test-setup.ts");

function renderHeader(
	props: Partial<Parameters<typeof Header>[0]> = {},
	initialPath = "/",
) {
	return render(
		<MemoryRouter initialEntries={[initialPath]}>
			<Header {...(props as Parameters<typeof Header>[0])} />
		</MemoryRouter>,
	);
}

describe("Header component", () => {
	it("renders branding with fallback code name", () => {
		renderHeader();

		expect(screen.getByText("Umaxica")).toBeInTheDocument();
		expect(screen.getByTitle("Umaxica")).toBeInTheDocument();
	});

	it("applies active styles to current navigation link", () => {
		renderHeader({}, "/message");

		const messageLink = screen.getByRole("link", { name: "💬" });
		expect(messageLink.className).toContain("scale-110");
	});

	it("renders external service links when URLs provided", () => {
		renderHeader({
			newsServiceUrl: "news.umaxica.app",
			docsServiceUrl: "docs.umaxica.app",
			helpServiceUrl: "help.umaxica.app",
		});

		expect(screen.getByRole("link", { name: "📰" })).toHaveAttribute(
			"href",
			"https://news.umaxica.app",
		);
		expect(screen.getByRole("link", { name: "📚" })).toHaveAttribute(
			"href",
			"https://docs.umaxica.app",
		);
		expect(screen.getByRole("link", { name: "❓" })).toHaveAttribute(
			"href",
			"https://help.umaxica.app",
		);
	});
});

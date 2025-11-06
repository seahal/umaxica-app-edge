import "../../test-setup.ts";

import { describe, expect, it } from "bun:test";
const { render, screen } = await import("@testing-library/react");
// @ts-expect-error - MemoryRouter may not be exported in all versions
import { MemoryRouter } from "react-router";

import { Header } from "../../src/components/Header";

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

describe("Header component (org)", () => {
	it("displays fallback branding when no code name is supplied", () => {
		renderHeader();

		expect(
			screen.getByText("Umaxica", { selector: "span" }),
		).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /Umaxica/ })).toHaveAttribute(
			"href",
			"/",
		);
	});

	it("renders provided code name and updates the logo title", () => {
		renderHeader({ codeName: "Org Hub" });

		expect(
			screen.getByText("Org Hub", { selector: "span" }),
		).toBeInTheDocument();
		expect(screen.getByTitle("Org Hub").closest("svg")).not.toBeNull();
	});

	it("highlights the active message route", () => {
		renderHeader({}, "/message");

		const messageLink = screen.getByRole("link", { name: "💬" });
		expect(messageLink.className).toContain("scale-110");
	});

	it("renders explore and login actions with active styles", () => {
		renderHeader({}, "/authentication");

		const exploreLink = screen.getByRole("link", { name: /Explore/ });
		expect(exploreLink).toHaveAttribute("href", "/explore");

		const loginLink = screen.getByRole("link", { name: /Login/ });
		expect(loginLink).toHaveAttribute("href", "/authentication");
		expect(loginLink.className).toContain("bg-blue-600");
	});

	it("exposes all internal navigation paths", () => {
		renderHeader();

		expect(screen.getByRole("link", { name: "💬" })).toHaveAttribute(
			"href",
			"/message",
		);
		expect(screen.getByRole("link", { name: "🔔" })).toHaveAttribute(
			"href",
			"/notification",
		);
		expect(screen.getByRole("link", { name: "⚙️" })).toHaveAttribute(
			"href",
			"/configuration",
		);
		expect(screen.getByRole("link", { name: /Explore/ })).toHaveAttribute(
			"href",
			"/explore",
		);
		expect(screen.getByRole("link", { name: /Login/ })).toHaveAttribute(
			"href",
			"/authentication",
		);
	});

	it("renders external service links with safe attributes", () => {
		renderHeader({
			newsServiceUrl: "news.example.org",
			docsServiceUrl: "docs.example.org",
			helpServiceUrl: "help.example.org",
		});

		const newsLink = screen.getByRole("link", { name: "📰" });
		expect(newsLink).toHaveAttribute("href", "https://news.example.org");
		expect(newsLink).toHaveAttribute("target", "_blank");
		expect(newsLink).toHaveAttribute("rel", "noopener noreferrer");
		expect(screen.getByRole("link", { name: "📚" })).toHaveAttribute(
			"href",
			"https://docs.example.org",
		);
		expect(screen.getByRole("link", { name: "❓" })).toHaveAttribute(
			"href",
			"https://help.example.org",
		);
	});

	it("omits optional external links when URLs are absent", () => {
		renderHeader();

		expect(screen.queryByRole("link", { name: "📰" })).toBeNull();
		expect(screen.queryByRole("link", { name: "📚" })).toBeNull();
		expect(screen.queryByRole("link", { name: "❓" })).toBeNull();
	});
});

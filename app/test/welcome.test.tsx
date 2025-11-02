import "../test-setup.ts";

import { describe, expect, it } from "bun:test";

const { render, screen } = await import("@testing-library/react");

import { Welcome } from "../src/welcome/welcome";

describe("Welcome component", () => {
	it("renders provided message and resource links", () => {
		render(<Welcome message="環境変数の値" />);

		expect(screen.getByText("環境変数の値")).toBeInTheDocument();
		expect(screen.getByAltText("React Router")).toBeInTheDocument();

		const links = screen.getAllByRole("link");
		expect(links.some((link) => link.textContent === "React Router Docs")).toBe(
			true,
		);
	});
});

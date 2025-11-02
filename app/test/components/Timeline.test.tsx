import { afterAll, afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Timeline } from "../../src/components/Timeline";

await import("../../test-setup.ts");

describe("Timeline component", () => {
	let user: ReturnType<typeof userEvent.setup>;
	const consoleSpy = mock.spy(console, "log");

	beforeEach(() => {
		user = userEvent.setup();
	});

	afterEach(() => {
		consoleSpy.mockReset();
	});

	afterAll(() => {
		consoleSpy.mockRestore();
	});

	it("renders initial posts and increments likes", async () => {
		render(<Timeline />);

		const articles = screen.getAllByRole("article");
		expect(articles.length).toBeGreaterThan(0);

		const firstPost = articles[0];
		expect(within(firstPost).getByText("田中太郎")).toBeInTheDocument();
		expect(within(firstPost).getByText("42")).toBeInTheDocument();

		await user.click(
			within(firstPost).getByRole("button", { name: "いいね" }),
		);

		expect(within(firstPost).getByText("43")).toBeInTheDocument();
	});

	it("adds a new post through the dialog", async () => {
		render(<Timeline />);

		await user.click(screen.getByRole("button", { name: "新規投稿" }));

		const textarea = await screen.findByLabelText("投稿内容");
		await user.type(textarea, "テスト投稿コンテンツ");

		await user.click(screen.getByRole("button", { name: "投稿する" }));

		const articles = screen.getAllByRole("article");
		expect(within(articles[0]).getByText("テスト投稿コンテンツ")).toBeInTheDocument();
	});
});

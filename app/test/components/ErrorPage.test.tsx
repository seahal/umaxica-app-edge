import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

import {
	ErrorPage,
	ServiceUnavailablePage,
} from "../../src/components/ErrorPage";

await import("../../test-setup.ts");

describe("ErrorPage component", () => {
	const user = userEvent.setup();
	let historySpy: ReturnType<typeof mock.method>;

	beforeEach(() => {
		historySpy = mock.method(window.history, "back");
	});

	afterEach(() => {
		historySpy.mockRestore();
	});

	it("renders status information and navigation", async () => {
		render(
			<MemoryRouter>
				<ErrorPage
					status={404}
					title="ページが見つかりません"
					message="メッセージ"
					suggestion="提案"
					showNavigation
					showDetails
					details="詳細"
					stack="stack trace"
				/>
			</MemoryRouter>,
		);

		expect(screen.getByText("404")).toBeInTheDocument();
		expect(screen.getByText("ページが見つかりません")).toBeInTheDocument();
		expect(screen.getByText("メッセージ")).toBeInTheDocument();
		expect(screen.getByText(/提案/)).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "🏠 ホームに戻る" })).toHaveAttribute(
			"href",
			"/",
		);

		await user.click(screen.getByRole("button", { name: "← 前のページに戻る" }));
		expect(historySpy).toHaveBeenCalled();
		expect(screen.getByText("詳細")).toBeInTheDocument();
		expect(screen.getByText("stack trace")).toBeInTheDocument();
	});

	it("renders service unavailable variant without navigation", () => {
		render(
			<MemoryRouter>
				<ServiceUnavailablePage />
			</MemoryRouter>,
		);

		expect(screen.getByText("メンテナンス中")).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "← 前のページに戻る" }),
		).not.toBeInTheDocument();
	});
});

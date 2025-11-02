import "../../test-setup.ts";

import { afterEach, beforeEach, describe, expect, it } from "bun:test";

const { render, screen } = await import("@testing-library/react");
const userEvent = (await import("@testing-library/user-event")).default;
import { MemoryRouter } from "react-router";

import {
	ErrorPage,
	ServiceUnavailablePage,
} from "../../src/components/ErrorPage";

describe("ErrorPage component", () => {
	let user: ReturnType<typeof userEvent.setup>;
	let historyCalls = 0;
	let originalHistoryBack: typeof window.history.back;

	beforeEach(() => {
		user = userEvent.setup();
		historyCalls = 0;
		originalHistoryBack = window.history.back;
		window.history.back = () => {
			historyCalls += 1;
		};
	});

	afterEach(() => {
		window.history.back = originalHistoryBack;
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
		const suggestions = screen.getAllByText(/提案/);
		expect(suggestions.length).toBeGreaterThan(0);
		expect(
			screen.getByRole("link", { name: "🏠 ホームに戻る" }),
		).toHaveAttribute("href", "/");

		await user.click(
			screen.getByRole("button", { name: "← 前のページに戻る" }),
		);
		expect(historyCalls).toBe(1);
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

	it("renders 404 error with search icon", () => {
		render(
			<MemoryRouter>
				<ErrorPage status={404} title="Not Found" message="Page not found" />
			</MemoryRouter>,
		);

		expect(screen.getByText("🔍")).toBeInTheDocument();
		expect(screen.getByText("404")).toBeInTheDocument();
	});

	it("renders 500 error with warning icon", () => {
		render(
			<MemoryRouter>
				<ErrorPage
					status={500}
					title="Server Error"
					message="Internal server error"
				/>
			</MemoryRouter>,
		);

		expect(screen.getByText("⚠️")).toBeInTheDocument();
		expect(screen.getByText("500")).toBeInTheDocument();
	});

	it("renders 503 error with construction icon", () => {
		render(
			<MemoryRouter>
				<ErrorPage
					status={503}
					title="Service Unavailable"
					message="Service unavailable"
				/>
			</MemoryRouter>,
		);

		expect(screen.getByText("🚧")).toBeInTheDocument();
		expect(screen.getByText("503")).toBeInTheDocument();
	});

	it("renders unknown error with X icon", () => {
		render(
			<MemoryRouter>
				<ErrorPage status={418} title="I'm a teapot" message="Error message" />
			</MemoryRouter>,
		);

		expect(screen.getByText("❌")).toBeInTheDocument();
		expect(screen.getByText("418")).toBeInTheDocument();
	});

	it("shows server error message for 500+ status codes", () => {
		render(
			<MemoryRouter>
				<ErrorPage status={500} title="Server Error" message="Error message" />
			</MemoryRouter>,
		);

		expect(
			screen.getByText(/サーバーで問題が発生しています/),
		).toBeInTheDocument();
	});

	it("shows client error message for 404 status", () => {
		render(
			<MemoryRouter>
				<ErrorPage status={404} title="Not Found" message="Error message" />
			</MemoryRouter>,
		);

		expect(screen.getByText(/URLが正しいか確認するか/)).toBeInTheDocument();
	});

	it("renders without suggestion when not provided", () => {
		render(
			<MemoryRouter>
				<ErrorPage status={404} title="Not Found" message="Error message" />
			</MemoryRouter>,
		);

		expect(screen.queryByText(/提案/)).not.toBeInTheDocument();
	});

	it("does not render details section when showDetails is false", () => {
		render(
			<MemoryRouter>
				<ErrorPage
					status={404}
					title="Not Found"
					message="Error message"
					showDetails={false}
					details="Some details"
					stack="Stack trace"
				/>
			</MemoryRouter>,
		);

		expect(screen.queryByText("Technical Details")).not.toBeInTheDocument();
		expect(screen.queryByText("Some details")).not.toBeInTheDocument();
		expect(screen.queryByText("Stack trace")).not.toBeInTheDocument();
	});

	it("renders common page links when showNavigation is true", () => {
		render(
			<MemoryRouter>
				<ErrorPage
					status={404}
					title="Not Found"
					message="Error message"
					showNavigation={true}
				/>
			</MemoryRouter>,
		);

		expect(screen.getByText("よく見られるページ")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
			"href",
			"/about",
		);
		expect(screen.getByRole("link", { name: "Sample" })).toHaveAttribute(
			"href",
			"/sample",
		);
		expect(screen.getByRole("link", { name: "Configure" })).toHaveAttribute(
			"href",
			"/configure",
		);
	});

	it("does not render common page links when showNavigation is false", () => {
		render(
			<MemoryRouter>
				<ErrorPage
					status={503}
					title="Maintenance"
					message="Under maintenance"
					showNavigation={false}
				/>
			</MemoryRouter>,
		);

		expect(screen.queryByText("よく見られるページ")).not.toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: "About" }),
		).not.toBeInTheDocument();
	});

	it("renders only stack trace when details is not provided", () => {
		render(
			<MemoryRouter>
				<ErrorPage
					status={500}
					title="Server Error"
					message="Error message"
					showDetails={true}
					stack="Stack trace here"
				/>
			</MemoryRouter>,
		);

		expect(screen.getByText("Technical Details")).toBeInTheDocument();
		expect(screen.getByText("Stack trace here")).toBeInTheDocument();
	});

	it("renders only details when stack is not provided", () => {
		render(
			<MemoryRouter>
				<ErrorPage
					status={500}
					title="Server Error"
					message="Error message"
					showDetails={true}
					details="Error details here"
				/>
			</MemoryRouter>,
		);

		expect(screen.getByText("Technical Details")).toBeInTheDocument();
		expect(screen.getByText("Error details here")).toBeInTheDocument();
	});

	it("renders contact message", () => {
		render(
			<MemoryRouter>
				<ErrorPage status={404} title="Not Found" message="Error message" />
			</MemoryRouter>,
		);

		expect(
			screen.getByText(/何度もこのエラーが発生する場合は/),
		).toBeInTheDocument();
	});
});

import "../../test-setup.ts";

import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "bun:test";

const { render, screen, within } = await import("@testing-library/react");
const userEvent = (await import("@testing-library/user-event")).default;

import { Timeline } from "../../src/components/Timeline";

describe("Timeline component", () => {
	let user: ReturnType<typeof userEvent.setup>;
	let originalConsoleLog: typeof console.log;
	let consoleCalls: unknown[][];

	beforeAll(() => {
		originalConsoleLog = console.log;
		consoleCalls = [];
		console.log = (...args: unknown[]) => {
			consoleCalls.push(args);
		};
	});

	beforeEach(() => {
		consoleCalls.length = 0;
		user = userEvent.setup();
	});

	afterEach(() => {
		consoleCalls.length = 0;
	});

	afterAll(() => {
		console.log = originalConsoleLog;
	});

	it("renders initial posts and increments likes", async () => {
		render(<Timeline />);

		const articles = screen.getAllByRole("article");
		expect(articles.length).toBeGreaterThan(0);

		const firstPost = articles[0];
		expect(within(firstPost).getByText("田中太郎")).toBeInTheDocument();
		expect(within(firstPost).getByText("42")).toBeInTheDocument();

		await user.click(within(firstPost).getByRole("button", { name: /いいね/ }));

		expect(within(firstPost).getByText("43")).toBeInTheDocument();
	});

	it("adds a new post through the dialog", async () => {
		render(<Timeline />);

		await user.click(screen.getByRole("button", { name: "新規投稿" }));

		const textarea = await screen.findByLabelText("投稿内容");
		await user.type(textarea, "テスト投稿コンテンツ");

		await user.click(screen.getByRole("button", { name: "投稿する" }));

		const articles = screen.getAllByRole("article");
		expect(
			within(articles[0]).getByText("テスト投稿コンテンツ"),
		).toBeInTheDocument();
	});

	it("increments repost count when repost button is clicked", async () => {
		render(<Timeline />);

		const articles = screen.getAllByRole("article");
		const firstPost = articles[0];

		// Initial repost count is 8
		expect(within(firstPost).getByText("8")).toBeInTheDocument();

		await user.click(
			within(firstPost).getByRole("button", { name: /リポスト/ }),
		);

		// Repost count should increment to 9
		expect(within(firstPost).getByText("9")).toBeInTheDocument();
	});

	it("logs to console when reply button is clicked", async () => {
		render(<Timeline />);

		const articles = screen.getAllByRole("article");
		const firstPost = articles[0];

		await user.click(within(firstPost).getByRole("button", { name: /返信/ }));

		// Check that console.log was called with the correct post ID
		expect(consoleCalls.length).toBeGreaterThan(0);
		expect(consoleCalls[consoleCalls.length - 1][0]).toContain("返信: 1");
	});

	it("switches between tabs", async () => {
		render(<Timeline />);

		// Initially on "おすすめ" tab, should show posts
		expect(screen.getAllByRole("article").length).toBeGreaterThan(0);

		// Switch to "フォロー中" tab
		await user.click(screen.getByRole("tab", { name: "フォロー中" }));

		// Should show the empty state message
		expect(
			screen.getByText("フォロー中のユーザーの投稿がここに表示されます"),
		).toBeInTheDocument();

		// Switch back to "おすすめ" tab
		await user.click(screen.getByRole("tab", { name: "おすすめ" }));

		// Should show posts again
		expect(screen.getAllByRole("article").length).toBeGreaterThan(0);
	});

	it("renders 'もっと見る' button", () => {
		render(<Timeline />);

		expect(
			screen.getByRole("button", { name: "もっと見る" }),
		).toBeInTheDocument();
	});

	it("renders the header with title", () => {
		render(<Timeline />);

		expect(screen.getByText("ホーム")).toBeInTheDocument();
	});

	it("renders initial posts count correctly", () => {
		render(<Timeline />);

		const articles = screen.getAllByRole("article");
		expect(articles).toHaveLength(5);
	});

	it("adds new post with correct default values", async () => {
		render(<Timeline />);

		await user.click(screen.getByRole("button", { name: "新規投稿" }));

		const textarea = await screen.findByLabelText("投稿内容");
		await user.type(textarea, "新しい投稿");

		await user.click(screen.getByRole("button", { name: "投稿する" }));

		const articles = screen.getAllByRole("article");
		const newPost = articles[0];

		// Check default values
		expect(within(newPost).getByText("あなた")).toBeInTheDocument();
		expect(within(newPost).getByText("@current_user")).toBeInTheDocument();
		expect(within(newPost).getByText("たった今")).toBeInTheDocument();
		expect(within(newPost).getByText("新しい投稿")).toBeInTheDocument();
	});
});

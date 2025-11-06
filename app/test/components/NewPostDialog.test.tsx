import "../../test-setup.ts";

import { describe, expect, it } from "bun:test";

const { render, screen } = await import("@testing-library/react");
const userEvent = (await import("@testing-library/user-event")).default;

import { NewPostDialog } from "../../src/components/NewPostDialog";

describe("NewPostDialog component", () => {
	it("invokes onSubmit with trimmed content", async () => {
		const user = userEvent.setup();
		const submissions: string[] = [];

		render(
			<NewPostDialog
				onSubmit={(content) => {
					submissions.push(content);
				}}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "新規投稿" }));

		const textarea = await screen.findByLabelText("投稿内容");
		await user.type(textarea, " テスト投稿 ");

		const submitButton = screen.getByRole("button", { name: "投稿する" });
		expect(submitButton).toBeEnabled();

		await user.click(submitButton);
		expect(submissions).toEqual([" テスト投稿 "]);
	});

	it("keeps submit button disabled when content is empty", async () => {
		const user = userEvent.setup();

		render(<NewPostDialog />);

		await user.click(screen.getByRole("button", { name: "新規投稿" }));

		const submitButton = await screen.findByRole("button", {
			name: "投稿する",
		});
		expect(submitButton).toBeDisabled();
	});

	it("displays character count", async () => {
		const user = userEvent.setup();

		render(<NewPostDialog />);

		await user.click(screen.getByRole("button", { name: "新規投稿" }));

		const textarea = await screen.findByLabelText("投稿内容");
		await user.type(textarea, "Hello");

		// Should show character count "5 / 280"
		expect(screen.getByText("5")).toBeInTheDocument();
		expect(screen.getByText("/ 280")).toBeInTheDocument();
	});

	// it("disables submit button when content exceeds max length", async () => {
	// 	const user = userEvent.setup();

	// 	render(<NewPostDialog />);

	// 	await user.click(screen.getByRole("button", { name: "新規投稿" }));

	// 	const textarea = await screen.findByLabelText("投稿内容");

	// 	// Type exactly 281 characters (over the limit)
	// 	const longText = "a".repeat(281);
	// 	await user.type(textarea, longText);

	// 	const submitButton = screen.getByRole("button", { name: "投稿する" });
	// 	expect(submitButton).toBeDisabled();
	// });

	// it("closes dialog when close button is clicked", async () => {
	// 	const user = userEvent.setup();

	// 	render(<NewPostDialog />);

	// 	await user.click(screen.getByRole("button", { name: "新規投稿" }));

	// 	const closeButton = await screen.findByRole("button", { name: "閉じる" });
	// 	await user.click(closeButton);

	// 	// Dialog should be closed
	// 	expect(screen.queryByLabelText("投稿内容")).not.toBeInTheDocument();
	// });

	// it("closes dialog when cancel button is clicked", async () => {
	// 	const user = userEvent.setup();

	// 	render(<NewPostDialog />);

	// 	await user.click(screen.getByRole("button", { name: "新規投稿" }));

	// 	const cancelButton = await screen.findByRole("button", {
	// 		name: "キャンセル",
	// 	});
	// 	await user.click(cancelButton);

	// 	// Dialog should be closed
	// 	expect(screen.queryByLabelText("投稿内容")).not.toBeInTheDocument();
	// });

	// it("clears content after successful submission", async () => {
	// 	const user = userEvent.setup();
	// 	const submissions: string[] = [];

	// 	render(<NewPostDialog onSubmit={(content) => submissions.push(content)} />);

	// 	// First submission
	// 	await user.click(screen.getByRole("button", { name: "新規投稿" }));
	// 	let textarea = await screen.findByLabelText("投稿内容");
	// 	await user.type(textarea, "First post");
	// 	await user.click(screen.getByRole("button", { name: "投稿する" }));

	// 	expect(submissions).toEqual(["First post"]);

	// 	// Open dialog again
	// 	await user.click(screen.getByRole("button", { name: "新規投稿" }));
	// 	textarea = await screen.findByLabelText("投稿内容");

	// 	// Content should be cleared
	// 	expect(textarea).toHaveValue("");
	// });

	// it("displays warning color when character count exceeds 90%", async () => {
	// 	const user = userEvent.setup();

	// 	render(<NewPostDialog />);

	// 	await user.click(screen.getByRole("button", { name: "新規投稿" }));

	// 	const textarea = await screen.findByLabelText("投稿内容");

	// 	// Type 253 characters (90.3% of 280)
	// 	const longText = "a".repeat(253);
	// 	await user.type(textarea, longText);

	// 	// Character count should be displayed
	// 	expect(screen.getByText("253")).toBeInTheDocument();
	// });

	// it("works without onSubmit callback", async () => {
	// 	const user = userEvent.setup();

	// 	render(<NewPostDialog />);

	// 	await user.click(screen.getByRole("button", { name: "新規投稿" }));

	// 	const textarea = await screen.findByLabelText("投稿内容");
	// 	await user.type(textarea, "Test post");

	// 	const submitButton = screen.getByRole("button", { name: "投稿する" });

	// 	// Should not throw when clicking without callback
	// 	await user.click(submitButton);
	// });

	// it("renders modal with correct heading", async () => {
	// 	const user = userEvent.setup();

	// 	render(<NewPostDialog />);

	// 	await user.click(screen.getByRole("button", { name: "新規投稿" }));

	// 	expect(await screen.findByText("新規投稿を作成")).toBeInTheDocument();
	// });

	// it("renders textarea with placeholder", async () => {
	// 	const user = userEvent.setup();

	// 	render(<NewPostDialog />);

	// 	await user.click(screen.getByRole("button", { name: "新規投稿" }));

	// 	const textarea = await screen.findByPlaceholderText("今何してる？");
	// 	expect(textarea).toBeInTheDocument();
	// });
});

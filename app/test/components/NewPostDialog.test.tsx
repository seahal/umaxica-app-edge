import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NewPostDialog } from "../../src/components/NewPostDialog";

await import("../../test-setup.ts");

describe("NewPostDialog component", () => {
	it("invokes onSubmit with trimmed content", async () => {
		const user = userEvent.setup();
		const handlers = { submit: (_content: string) => {} };
		const handleSubmit = mock.method(handlers, "submit");

		render(<NewPostDialog onSubmit={handlers.submit} />);

		await user.click(screen.getByRole("button", { name: "新規投稿" }));

		const textarea = await screen.findByLabelText("投稿内容");
		await user.type(textarea, " テスト投稿 ");

		const submitButton = screen.getByRole("button", { name: "投稿する" });
		expect(submitButton).toBeEnabled();

		await user.click(submitButton);
		expect(handleSubmit).toHaveBeenCalledWith(" テスト投稿 ");
	});

	it("keeps submit button disabled when content is empty", async () => {
		const user = userEvent.setup();

		render(<NewPostDialog />);

		await user.click(screen.getByRole("button", { name: "新規投稿" }));

		const submitButton = await screen.findByRole("button", { name: "投稿する" });
		expect(submitButton).toBeDisabled();
	});
});

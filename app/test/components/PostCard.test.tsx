import { describe, expect, it, mock } from "bun:test";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PostCard } from "../../src/components/PostCard";

await import("../../test-setup.ts");

const basePost = {
	id: "post-1",
	author: "テストユーザー",
	username: "test_user",
	content: "これはテスト投稿です",
	timestamp: "1時間前",
	likes: 10,
	reposts: 5,
	replies: 3,
};

describe("PostCard component", () => {
	it("renders post content and metadata", () => {
		render(<PostCard post={basePost} />);

		expect(screen.getByText("テストユーザー")).toBeInTheDocument();
		expect(screen.getByText("@test_user")).toBeInTheDocument();
		expect(screen.getByText("これはテスト投稿です")).toBeInTheDocument();
		expect(screen.getByText("1時間前")).toBeInTheDocument();
	});

	it("invokes callbacks for reply, repost, and like actions", async () => {
		const user = userEvent.setup();
		const handlers = {
			reply: (_id: string) => {},
			repost: (_id: string) => {},
			like: (_id: string) => {},
		};
		const handleReply = mock.method(handlers, "reply");
		const handleRepost = mock.method(handlers, "repost");
		const handleLike = mock.method(handlers, "like");

		render(
			<PostCard
				post={basePost}
				onReply={handlers.reply}
				onRepost={handlers.repost}
				onLike={handlers.like}
			/>,
		);

		const article = screen.getByRole("article");
		await user.click(within(article).getByRole("button", { name: "返信" }));
		await user.click(within(article).getByRole("button", { name: "リポスト" }));
		await user.click(within(article).getByRole("button", { name: "いいね" }));

		expect(handleReply).toHaveBeenCalledWith("post-1");
		expect(handleRepost).toHaveBeenCalledWith("post-1");
		expect(handleLike).toHaveBeenCalledWith("post-1");
	});
});

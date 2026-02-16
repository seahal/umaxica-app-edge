import "../../test-setup.ts";

import { describe, expect, it } from "bun:test";

const { render, screen, within } = await import("@testing-library/react");
const userEvent = (await import("@testing-library/user-event")).default;

import { PostCard } from "../../src/components/PostCard";

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
    const replyCalls: string[] = [];
    const repostCalls: string[] = [];
    const likeCalls: string[] = [];

    render(
      <PostCard
        post={basePost}
        onReply={(id) => {
          replyCalls.push(id);
        }}
        onRepost={(id) => {
          repostCalls.push(id);
        }}
        onLike={(id) => {
          likeCalls.push(id);
        }}
      />,
    );

    const article = screen.getByRole("article");
    await user.click(within(article).getByRole("button", { name: /返信/ }));
    await user.click(within(article).getByRole("button", { name: /リポスト/ }));
    await user.click(within(article).getByRole("button", { name: /いいね/ }));

    expect(replyCalls).toEqual(["post-1"]);
    expect(repostCalls).toEqual(["post-1"]);
    expect(likeCalls).toEqual(["post-1"]);
  });

  it("displays avatar with first character of author name", () => {
    render(<PostCard post={basePost} />);

    // Avatar should contain the first character of author name
    const avatar = screen.getByText("テ");
    expect(avatar).toBeInTheDocument();
  });

  it("renders post with zero counts", () => {
    const postWithZeros = {
      ...basePost,
      likes: 0,
      reposts: 0,
      replies: 0,
    };

    render(<PostCard post={postWithZeros} />);

    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBe(3); // replies, reposts, likes
  });

  it("renders post with large numbers", () => {
    const popularPost = {
      ...basePost,
      likes: 1000,
      reposts: 500,
      replies: 250,
    };

    render(<PostCard post={popularPost} />);

    expect(screen.getByText("1000")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("250")).toBeInTheDocument();
  });

  it("renders multiline content correctly", () => {
    const multilinePost = {
      ...basePost,
      content: "行1\n行2\n行3",
    };

    render(<PostCard post={multilinePost} />);

    expect(screen.getByText(/行1.*行2.*行3/)).toBeInTheDocument();
  });

  it("works without callbacks", async () => {
    const user = userEvent.setup();

    render(<PostCard post={basePost} />);

    // Should not throw when clicking buttons without callbacks
    const article = screen.getByRole("article");
    await user.click(within(article).getByRole("button", { name: /返信/ }));
    await user.click(within(article).getByRole("button", { name: /リポスト/ }));
    await user.click(within(article).getByRole("button", { name: /いいね/ }));
  });

  it("renders username with @ symbol", () => {
    render(<PostCard post={basePost} />);

    expect(screen.getByText("@test_user")).toBeInTheDocument();
  });

  it("shows all action buttons with icons", () => {
    render(<PostCard post={basePost} />);

    // All three action buttons should be present
    expect(screen.getByRole("button", { name: /返信/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /リポスト/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /いいね/ })).toBeInTheDocument();
  });
});

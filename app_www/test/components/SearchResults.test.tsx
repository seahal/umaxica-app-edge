import "../../test-setup.ts";

import { describe, expect, it } from "vitest";

const { render, screen } = await import("@testing-library/react");

import { SearchResults } from "../../src/components/SearchResults";

const samplePost = {
  id: "post-1",
  author: "田中太郎",
  username: "tanaka",
  content: "React Aria を触っています",
  timestamp: "1時間前",
  likes: 10,
  reposts: 1,
  replies: 0,
};

const sampleUser = {
  id: "user-1",
  name: "山田花子",
  username: "yamada",
  bio: "アクセシビリティ愛好家",
  followers: 1200,
  verified: true,
};

const sampleTrend = {
  id: "trend-1",
  topic: "React Aria",
  category: "テクノロジー",
  posts: 5234,
};

describe("SearchResults component", () => {
  it("renders empty state when query is blank", () => {
    render(<SearchResults query="" type="all" />);

    expect(screen.getByText("何かを検索してみましょう")).toBeInTheDocument();
    expect(
      screen.getByText("ユーザー名、投稿内容、トレンドなどを検索できます"),
    ).toBeInTheDocument();
  });

  it("renders grouped results when type is all", () => {
    render(
      <SearchResults
        query="React"
        type="all"
        posts={[samplePost]}
        users={[sampleUser]}
        trends={[sampleTrend]}
      />,
    );

    expect(screen.getByRole("heading", { name: "ユーザー" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "投稿" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "トレンド" })).toBeInTheDocument();

    expect(screen.getByText("@tanaka")).toBeInTheDocument();
    expect(screen.getAllByText((content) => content.includes("React")).length).toBeGreaterThan(0);
    expect(screen.getByText("5,234 件の投稿")).toBeInTheDocument();
  });

  it("highlights matching text in post results", () => {
    render(
      <SearchResults
        query="React"
        type="posts"
        posts={[{ ...samplePost, content: "React と Remix を学ぶ" }]}
      />,
    );

    const highlights = screen.getAllByText("React", { selector: "mark" });
    expect(highlights).toHaveLength(1);
    expect(highlights[0]).toBeInTheDocument();
  });

  it("shows no results message when specific filter has no data", () => {
    render(<SearchResults query="React" type="users" users={[]} />);

    expect(screen.getByText("「React」に一致する結果が見つかりませんでした")).toBeInTheDocument();
  });
});

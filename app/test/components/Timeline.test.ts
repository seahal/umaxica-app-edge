import { describe, expect, it } from "bun:test";
import type { Post } from "../../src/components/PostCard";

// タイムライン関連のユーティリティ関数
function sortPostsByTime(posts: Post[]): Post[] {
	const timeMap: Record<string, number> = {
		たった今: 0,
		"1分前": 1,
		"1時間前": 60,
		"2時間前": 120,
		"4時間前": 240,
		"6時間前": 360,
		"8時間前": 480,
		"10時間前": 600,
		"1日前": 1440,
	};

	return [...posts].sort((a, b) => {
		const aTime = timeMap[a.timestamp] ?? 999999;
		const bTime = timeMap[b.timestamp] ?? 999999;
		return aTime - bTime;
	});
}

function filterPostsByAuthor(posts: Post[], author: string): Post[] {
	return posts.filter((post) => post.author === author);
}

function getTopPosts(posts: Post[], limit = 5): Post[] {
	return [...posts].sort((a, b) => b.likes - a.likes).slice(0, limit);
}

describe("Timeline Utilities", () => {
	const samplePosts: Post[] = [
		{
			id: "1",
			author: "田中太郎",
			username: "tanaka",
			content: "投稿1",
			timestamp: "2時間前",
			likes: 42,
			reposts: 8,
			replies: 5,
		},
		{
			id: "2",
			author: "山田花子",
			username: "yamada",
			content: "投稿2",
			timestamp: "4時間前",
			likes: 128,
			reposts: 23,
			replies: 15,
		},
		{
			id: "3",
			author: "佐藤次郎",
			username: "sato",
			content: "投稿3",
			timestamp: "6時間前",
			likes: 67,
			reposts: 3,
			replies: 8,
		},
		{
			id: "4",
			author: "田中太郎",
			username: "tanaka",
			content: "投稿4",
			timestamp: "1時間前",
			likes: 15,
			reposts: 2,
			replies: 1,
		},
	];

	describe("sortPostsByTime", () => {
		it("should sort posts by time (newest first)", () => {
			const sorted = sortPostsByTime(samplePosts);
			expect(sorted[0].timestamp).toBe("1時間前");
			expect(sorted[sorted.length - 1].timestamp).toBe("6時間前");
		});

		it("should not mutate original array", () => {
			const original = [...samplePosts];
			sortPostsByTime(samplePosts);
			expect(samplePosts).toEqual(original);
		});

		it("should handle empty array", () => {
			expect(sortPostsByTime([])).toEqual([]);
		});
	});

	describe("filterPostsByAuthor", () => {
		it("should filter posts by author", () => {
			const filtered = filterPostsByAuthor(samplePosts, "田中太郎");
			expect(filtered.length).toBe(2);
			expect(filtered.every((p) => p.author === "田中太郎")).toBe(true);
		});

		it("should return empty array if author not found", () => {
			const filtered = filterPostsByAuthor(samplePosts, "存在しない");
			expect(filtered).toEqual([]);
		});

		it("should handle empty array", () => {
			expect(filterPostsByAuthor([], "田中太郎")).toEqual([]);
		});
	});

	describe("getTopPosts", () => {
		it("should return top posts by likes", () => {
			const top = getTopPosts(samplePosts, 2);
			expect(top.length).toBe(2);
			expect(top[0].likes).toBe(128);
			expect(top[1].likes).toBe(67);
		});

		it("should default to 5 posts", () => {
			const top = getTopPosts(samplePosts);
			expect(top.length).toBeLessThanOrEqual(5);
		});

		it("should handle fewer posts than limit", () => {
			const top = getTopPosts(samplePosts, 10);
			expect(top.length).toBe(4);
		});

		it("should not mutate original array", () => {
			const original = [...samplePosts];
			getTopPosts(samplePosts);
			expect(samplePosts).toEqual(original);
		});
	});
});

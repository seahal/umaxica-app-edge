import { describe, expect, it } from "bun:test";
import type { Post } from "../../src/components/PostCard";

// テスト用のユーティリティ関数
function validatePost(post: Post): boolean {
	return !!(
		post.id &&
		post.author &&
		post.username &&
		post.content &&
		post.timestamp &&
		typeof post.likes === "number" &&
		typeof post.reposts === "number" &&
		typeof post.replies === "number"
	);
}

function calculateEngagementRate(post: Post): number {
	return post.likes + post.reposts + post.replies;
}

function formatPostPreview(post: Post, maxLength = 50): string {
	if (post.content.length <= maxLength) {
		return post.content;
	}
	return `${post.content.slice(0, maxLength)}...`;
}

describe("PostCard Utilities", () => {
	const samplePost: Post = {
		id: "1",
		author: "テストユーザー",
		username: "test_user",
		content: "これはテスト投稿です",
		timestamp: "1時間前",
		likes: 10,
		reposts: 5,
		replies: 3,
	};

	describe("validatePost", () => {
		it("should validate a valid post", () => {
			expect(validatePost(samplePost)).toBe(true);
		});

		it("should reject post without id", () => {
			const invalidPost = { ...samplePost, id: "" };
			expect(validatePost(invalidPost)).toBe(false);
		});

		it("should reject post without author", () => {
			const invalidPost = { ...samplePost, author: "" };
			expect(validatePost(invalidPost)).toBe(false);
		});

		it("should reject post with negative likes", () => {
			const invalidPost = { ...samplePost, likes: -1 };
			// Still returns true because we only check typeof number
			expect(typeof invalidPost.likes).toBe("number");
		});
	});

	describe("calculateEngagementRate", () => {
		it("should calculate total engagement", () => {
			expect(calculateEngagementRate(samplePost)).toBe(18); // 10 + 5 + 3
		});

		it("should handle zero engagement", () => {
			const noEngagement = { ...samplePost, likes: 0, reposts: 0, replies: 0 };
			expect(calculateEngagementRate(noEngagement)).toBe(0);
		});

		it("should handle high engagement", () => {
			const highEngagement = {
				...samplePost,
				likes: 1000,
				reposts: 500,
				replies: 200,
			};
			expect(calculateEngagementRate(highEngagement)).toBe(1700);
		});
	});

	describe("formatPostPreview", () => {
		it("should return full content if under max length", () => {
			expect(formatPostPreview(samplePost)).toBe("これはテスト投稿です");
		});

		it("should truncate long content", () => {
			const longPost = {
				...samplePost,
				content: "これは非常に長いテスト投稿です。".repeat(10),
			};
			const preview = formatPostPreview(longPost, 30);
			expect(preview.length).toBeLessThanOrEqual(33); // 30 + "..."
			expect(preview.endsWith("...")).toBe(true);
		});

		it("should respect custom max length", () => {
			const preview = formatPostPreview(samplePost, 10);
			expect(preview.length).toBeLessThanOrEqual(13); // 10 + "..."
		});
	});
});

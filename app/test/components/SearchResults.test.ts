import { describe, expect, it } from "bun:test";

// 検索結果関連の型
interface SearchResult {
	type: "user" | "post" | "trend";
	id: string;
	relevance: number;
}

// 検索関連のユーティリティ関数
function highlightText(text: string, query: string): string {
	if (!query.trim()) return text;
	const regex = new RegExp(`(${query})`, "gi");
	return text.replace(regex, "<mark>$1</mark>");
}

function calculateRelevance(text: string, query: string): number {
	const lowerText = text.toLowerCase();
	const lowerQuery = query.toLowerCase();

	if (lowerText === lowerQuery) return 100;
	if (lowerText.startsWith(lowerQuery)) return 80;
	if (lowerText.includes(lowerQuery)) return 60;
	return 0;
}

function sortByRelevance(results: SearchResult[]): SearchResult[] {
	return [...results].sort((a, b) => b.relevance - a.relevance);
}

function groupByType(results: SearchResult[]): Record<string, SearchResult[]> {
	return results.reduce(
		(acc, result) => {
			if (!acc[result.type]) {
				acc[result.type] = [];
			}
			acc[result.type].push(result);
			return acc;
		},
		{} as Record<string, SearchResult[]>,
	);
}

function filterByMinRelevance(
	results: SearchResult[],
	minRelevance: number,
): SearchResult[] {
	return results.filter((r) => r.relevance >= minRelevance);
}

describe("SearchResults Utilities", () => {
	describe("highlightText", () => {
		it("should highlight matching text", () => {
			const result = highlightText("React Aria is great", "React");
			expect(result).toBe("<mark>React</mark> Aria is great");
		});

		it("should be case insensitive", () => {
			const result = highlightText("React Aria is great", "react");
			expect(result).toBe("<mark>React</mark> Aria is great");
		});

		it("should highlight multiple occurrences", () => {
			const result = highlightText("React and React Router", "React");
			expect(result).toContain("<mark>React</mark>");
			expect(result.match(/<mark>/g)?.length).toBe(2);
		});

		it("should handle empty query", () => {
			const result = highlightText("React Aria", "");
			expect(result).toBe("React Aria");
		});
	});

	describe("calculateRelevance", () => {
		it("should give 100 for exact match", () => {
			expect(calculateRelevance("react", "react")).toBe(100);
		});

		it("should give 80 for starts with", () => {
			expect(calculateRelevance("react aria", "react")).toBe(80);
		});

		it("should give 60 for contains", () => {
			expect(calculateRelevance("using react", "react")).toBe(60);
		});

		it("should give 0 for no match", () => {
			expect(calculateRelevance("vue", "react")).toBe(0);
		});

		it("should be case insensitive", () => {
			expect(calculateRelevance("React", "react")).toBe(100);
		});
	});

	describe("sortByRelevance", () => {
		const sampleResults: SearchResult[] = [
			{ type: "post", id: "1", relevance: 60 },
			{ type: "user", id: "2", relevance: 100 },
			{ type: "trend", id: "3", relevance: 80 },
		];

		it("should sort by relevance descending", () => {
			const sorted = sortByRelevance(sampleResults);
			expect(sorted[0].relevance).toBe(100);
			expect(sorted[1].relevance).toBe(80);
			expect(sorted[2].relevance).toBe(60);
		});

		it("should not mutate original array", () => {
			const original = [...sampleResults];
			sortByRelevance(sampleResults);
			expect(sampleResults).toEqual(original);
		});
	});

	describe("groupByType", () => {
		const sampleResults: SearchResult[] = [
			{ type: "post", id: "1", relevance: 60 },
			{ type: "user", id: "2", relevance: 100 },
			{ type: "post", id: "3", relevance: 80 },
			{ type: "trend", id: "4", relevance: 70 },
		];

		it("should group results by type", () => {
			const grouped = groupByType(sampleResults);
			expect(grouped.post.length).toBe(2);
			expect(grouped.user.length).toBe(1);
			expect(grouped.trend.length).toBe(1);
		});

		it("should handle empty array", () => {
			const grouped = groupByType([]);
			expect(Object.keys(grouped).length).toBe(0);
		});
	});

	describe("filterByMinRelevance", () => {
		const sampleResults: SearchResult[] = [
			{ type: "post", id: "1", relevance: 60 },
			{ type: "user", id: "2", relevance: 100 },
			{ type: "trend", id: "3", relevance: 80 },
			{ type: "post", id: "4", relevance: 40 },
		];

		it("should filter by minimum relevance", () => {
			const filtered = filterByMinRelevance(sampleResults, 70);
			expect(filtered.length).toBe(2);
			expect(filtered.every((r) => r.relevance >= 70)).toBe(true);
		});

		it("should return all results if threshold is 0", () => {
			const filtered = filterByMinRelevance(sampleResults, 0);
			expect(filtered.length).toBe(4);
		});

		it("should return empty array if threshold is too high", () => {
			const filtered = filterByMinRelevance(sampleResults, 200);
			expect(filtered.length).toBe(0);
		});
	});
});

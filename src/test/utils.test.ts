import { describe, expect, it, beforeEach, afterEach, mock } from "bun:test";

// ユーティリティ関数のテスト例
describe("Utils Tests", () => {
	// 基本的なテスト
	it("should add two numbers", () => {
		const result = 2 + 3;
		expect(result).toBe(5);
	});

	// 配列のテスト
	it("should filter array correctly", () => {
		const numbers = [1, 2, 3, 4, 5];
		const evenNumbers = numbers.filter((n) => n % 2 === 0);
		expect(evenNumbers).toEqual([2, 4]);
		expect(evenNumbers).toHaveLength(2);
	});

	// オブジェクトのテスト
	it("should create user object correctly", () => {
		const user = {
			id: 1,
			name: "Test User",
			email: "test@example.com",
		};

		expect(user).toMatchObject({
			id: expect.any(Number),
			name: expect.any(String),
			email: expect.stringContaining("@"),
		});
	});

	// 非同期関数のテスト
	it("should handle async operations", async () => {
		const delay = (ms: number) =>
			new Promise((resolve) => setTimeout(resolve, ms));

		const start = Date.now();
		await delay(100);
		const elapsed = Date.now() - start;

		expect(elapsed).toBeGreaterThanOrEqual(100);
	});

	// エラーハンドリングのテスト
	it("should throw error for invalid input", () => {
		const divide = (a: number, b: number) => {
			if (b === 0) throw new Error("Division by zero");
			return a / b;
		};

		expect(() => divide(10, 0)).toThrow("Division by zero");
		expect(divide(10, 2)).toBe(5);
	});

	// モックのテスト
	it("should work with mocks", () => {
		const mockFn = mock(() => "mocked result");

		const result = mockFn();

		expect(mockFn).toHaveBeenCalled();
		expect(mockFn).toHaveBeenCalledTimes(1);
		expect(result).toBe("mocked result");
	});
});

// セットアップとクリーンアップのテスト例
describe("Setup and Cleanup Tests", () => {
	let testData: { items: string[]; count: number } | null;

	beforeEach(() => {
		// 各テスト実行前の準備
		testData = {
			items: [],
			count: 0,
		};
	});

	afterEach(() => {
		// 各テスト実行後のクリーンアップ
		testData = null;
	});

	it("should initialize test data", () => {
		if (testData) {
			expect(testData.items).toEqual([]);
			expect(testData.count).toBe(0);
		}
	});

	it("should modify test data", () => {
		if (testData) {
			testData.items.push("item1");
			testData.count = 1;

			expect(testData.items).toHaveLength(1);
			expect(testData.count).toBe(1);
		}
	});
});

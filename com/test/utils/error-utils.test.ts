import { describe, expect, it } from "bun:test";
import {
	formatErrorForLogging,
	getErrorAction,
	getErrorSeverity,
	getErrorType,
	getJapaneseErrorMessage,
	getRetryDelay,
	shouldRetry,
} from "../../src/utils/error-utils";

// エラーユーティリティ関数のテスト
// この部分はエラー処理ユーティリティテストの責務: エラー処理関数の正確な動作を検証
describe("Error Utils", () => {
	describe("getErrorType", () => {
		it("should identify client errors correctly", () => {
			expect(getErrorType(400)).toBe("client");
			expect(getErrorType(404)).toBe("client");
			expect(getErrorType(422)).toBe("client");
			expect(getErrorType(499)).toBe("client");
		});

		it("should identify server errors correctly", () => {
			expect(getErrorType(500)).toBe("server");
			expect(getErrorType(502)).toBe("server");
			expect(getErrorType(503)).toBe("server");
			expect(getErrorType(599)).toBe("server");
		});

		it("should identify unknown errors correctly", () => {
			expect(getErrorType(200)).toBe("unknown");
			expect(getErrorType(300)).toBe("unknown");
			expect(getErrorType(100)).toBe("unknown");
			expect(getErrorType(600)).toBe("unknown");
		});
	});

	describe("getErrorSeverity", () => {
		it("should assign low severity to common client errors", () => {
			expect(getErrorSeverity(404)).toBe("low");
			expect(getErrorSeverity(403)).toBe("low");
		});

		it("should assign medium severity to validation errors", () => {
			expect(getErrorSeverity(400)).toBe("medium");
			expect(getErrorSeverity(401)).toBe("medium");
			expect(getErrorSeverity(422)).toBe("medium");
		});

		it("should assign high severity to server errors", () => {
			expect(getErrorSeverity(500)).toBe("high");
			expect(getErrorSeverity(502)).toBe("high");
			expect(getErrorSeverity(504)).toBe("high");
		});

		it("should assign critical severity to service unavailable", () => {
			expect(getErrorSeverity(503)).toBe("critical");
		});
	});

	describe("getJapaneseErrorMessage", () => {
		it("should return Japanese messages for common status codes", () => {
			expect(getJapaneseErrorMessage(404)).toBe(
				"お探しのページは見つかりませんでした。",
			);
			expect(getJapaneseErrorMessage(500)).toBe(
				"サーバーで内部エラーが発生しました。",
			);
			expect(getJapaneseErrorMessage(503)).toBe(
				"サービスが一時的に利用できません。",
			);
		});

		it("should use original message when available", () => {
			const customMessage = "カスタムエラーメッセージ";
			expect(getJapaneseErrorMessage(999, customMessage)).toBe(customMessage);
		});

		it("should return default message for unknown status codes", () => {
			expect(getJapaneseErrorMessage(999)).toBe(
				"予期しないエラーが発生しました。",
			);
		});
	});

	describe("getErrorAction", () => {
		it("should provide appropriate actions for different errors", () => {
			const action404 = getErrorAction(404);
			expect(action404).toContain("URL");
			expect(action404).toContain("ホームページ");

			const action500 = getErrorAction(500);
			expect(action500).toContain("再度お試し");
			expect(action500).toContain("お問い合わせ");

			const action503 = getErrorAction(503);
			expect(action503).toContain("メンテナンス");
		});
	});

	describe("formatErrorForLogging", () => {
		it("should format Response errors correctly", () => {
			const mockResponse = new Response("Not Found", {
				status: 404,
				statusText: "Not Found",
			});

			const logEntry = formatErrorForLogging(mockResponse, {
				url: "/test",
				userAgent: "Test Agent",
			});

			expect(logEntry.status).toBe(404);
			expect(logEntry.type).toBe("client");
			expect(logEntry.severity).toBe("low");
			expect(logEntry.message).toBe("Not Found");
			expect(logEntry.url).toBe("/test");
			expect(logEntry.userAgent).toBe("Test Agent");
			expect(logEntry.timestamp).toBeDefined();
		});

		it("should format JavaScript errors correctly", () => {
			const error = new Error("Test error");
			const logEntry = formatErrorForLogging(error);

			expect(logEntry.status).toBe(500);
			expect(logEntry.type).toBe("server");
			expect(logEntry.severity).toBe("high");
			expect(logEntry.message).toBe("Test error");
		});
	});

	describe("shouldRetry", () => {
		it("should allow retries for retryable status codes", () => {
			expect(shouldRetry(408, 0)).toBe(true); // Timeout
			expect(shouldRetry(429, 1)).toBe(true); // Rate limit
			expect(shouldRetry(500, 2)).toBe(true); // Server error
			expect(shouldRetry(503, 0)).toBe(true); // Service unavailable
		});

		it("should not allow retries for non-retryable status codes", () => {
			expect(shouldRetry(404, 0)).toBe(false); // Not found
			expect(shouldRetry(400, 0)).toBe(false); // Bad request
			expect(shouldRetry(401, 0)).toBe(false); // Unauthorized
		});

		it("should respect max retry limit", () => {
			expect(shouldRetry(500, 3)).toBe(false); // Exceeded max retries
			expect(shouldRetry(503, 4)).toBe(false); // Exceeded max retries
		});
	});

	describe("getRetryDelay", () => {
		it("should calculate exponential backoff correctly", () => {
			expect(getRetryDelay(0)).toBe(1000); // 2^0 * 1000 = 1000
			expect(getRetryDelay(1)).toBe(2000); // 2^1 * 1000 = 2000
			expect(getRetryDelay(2)).toBe(4000); // 2^2 * 1000 = 4000
			expect(getRetryDelay(3)).toBe(8000); // 2^3 * 1000 = 8000
		});

		it("should cap delay at maximum value", () => {
			expect(getRetryDelay(10)).toBe(30000); // Should be capped at 30000
			expect(getRetryDelay(20)).toBe(30000); // Should be capped at 30000
		});

		it("should always return positive delays", () => {
			for (let i = 0; i < 10; i++) {
				expect(getRetryDelay(i)).toBeGreaterThan(0);
			}
		});
	});

	describe("Integration scenarios", () => {
		it("should handle complete error processing workflow", () => {
			const status = 500;
			const error = new Response("Internal Server Error", {
				status,
				statusText: "Server Error",
			});

			// エラー分類
			const type = getErrorType(status);
			const severity = getErrorSeverity(status);
			const message = getJapaneseErrorMessage(status);
			const action = getErrorAction(status);

			// ログ記録
			const logEntry = formatErrorForLogging(error);

			// 再試行判定
			const canRetry = shouldRetry(status, 0);
			const retryDelay = canRetry ? getRetryDelay(0) : 0;

			// アサーション
			expect(type).toBe("server");
			expect(severity).toBe("high");
			expect(message).toContain("サーバー");
			expect(action).toContain("お問い合わせ");
			expect(logEntry.status).toBe(500);
			expect(canRetry).toBe(true);
			expect(retryDelay).toBe(1000);
		});

		it("should handle client error workflow", () => {
			const status = 404;
			const _error = new Response("Not Found", { status });

			const type = getErrorType(status);
			const severity = getErrorSeverity(status);
			const canRetry = shouldRetry(status, 0);

			expect(type).toBe("client");
			expect(severity).toBe("low");
			expect(canRetry).toBe(false);
		});

		it("should handle critical service error workflow", () => {
			const status = 503;
			const _error = new Response("Service Unavailable", { status });

			const severity = getErrorSeverity(status);
			const message = getJapaneseErrorMessage(status);
			const canRetry = shouldRetry(status, 0);

			expect(severity).toBe("critical");
			expect(message).toContain("利用できません");
			expect(canRetry).toBe(true);
		});
	});

	describe("Edge cases", () => {
		it("should handle null and undefined inputs gracefully", () => {
			expect(getErrorType(NaN)).toBe("unknown");
			expect(getJapaneseErrorMessage(null as unknown as number)).toBe(
				"予期しないエラーが発生しました。",
			);
			expect(shouldRetry(undefined as unknown as number, 0)).toBe(false);
		});

		it("should handle extreme values", () => {
			expect(getErrorType(-1)).toBe("unknown");
			expect(getErrorType(999)).toBe("unknown");
			expect(getRetryDelay(-1)).toBeGreaterThan(0);
		});

		it("should handle JavaScript Error objects properly", () => {
			const customError = new Error("Custom error message");
			customError.stack = "Stack trace here";

			const logEntry = formatErrorForLogging(customError);

			expect(logEntry.message).toBe("Custom error message");
			expect(logEntry.status).toBe(500);
			expect(logEntry.type).toBe("server");
		});
	});
});

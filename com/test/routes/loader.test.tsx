import { describe, it, expect } from "bun:test";

// テスト対象のローダー関数をインポート
import { loader as homeLoader } from "../../src/routes/home";

// モックコンテキスト作成のヘルパー関数
// この部分は基盤機能の責務: テスト実行のための共通の設定とモックデータを提供
// テストではこう確認する: 各テストでモックが適切に設定されるかをテスト
function createMockContext(envValues: Record<string, string> = {}) {
	return {
		cloudflare: {
			env: {
				VALUE_FROM_CLOUDFLARE: "Test Environment Message",
				...envValues,
			},
			cf: {},
			ctx: { waitUntil: () => {} },
		},
	};
}

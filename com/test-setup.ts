// テストセットアップファイル
// この部分はテスト環境設定の責務: テスト実行に必要なグローバル設定とモックを提供
// テストではこう確認する: jest-domマッチャーが正しく設定され、テスト環境が適切に初期化されるかをテスト

import "@testing-library/jest-dom";
import { afterEach, beforeAll, afterAll } from "bun:test";
import { cleanup } from "@testing-library/react";

// React Testing Library のクリーンアップ
// この部分はDOM状態管理の責務: 各テスト後にDOM状態をリセット
afterEach(() => {
	cleanup();
});

// React Router のナビゲーション関数をモック
// この部分はルーティングモックの責務: テスト環境でのナビゲーション機能を提供
(globalThis as any).navigate = () => {};

// パフォーマンス測定のモック
// この部分はパフォーマンステストの責務: performance.now()をテスト環境で利用可能にする
if (typeof globalThis.performance === "undefined") {
	(globalThis as any).performance = {
		now: () => Date.now(),
	};
}

// console の拡張（テスト時のログ出力制御）
// この部分はログ制御の責務: テスト実行時の不要なログ出力を抑制
const originalConsoleError = console.error;
console.error = (...args) => {
	// React の開発環境警告を除外
	if (typeof args[0] === "string" && args[0].includes("Warning:")) {
		return;
	}
	// ActとuseEffectの警告も除外
	if (typeof args[0] === "string" && args[0].includes("Act")) {
		return;
	}
	originalConsoleError.apply(console, args);
};

// テスト開始前の初期化
// この部分は初期化の責務: テスト実行前の共通初期化処理を実行
beforeAll(() => {
	// グローバルな初期化処理があればここに記述
});

// テスト終了後のクリーンアップ
// この部分は終了処理の責務: 全テスト完了後のクリーンアップ処理を実行
afterAll(() => {
	// 全テスト完了後のクリーンアップ処理があればここに記述
});

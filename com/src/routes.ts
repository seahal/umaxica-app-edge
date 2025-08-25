import { type RouteConfig, index, route } from "@react-router/dev/routes";

// ルート定義の責務: アプリケーション全体のルーティング設定を管理
// テストではこう確認する: 各ルートが正しいコンポーネントにマッピングされていることをテスト
export default [
	index("routes/home.tsx"), // ホームページ（/）
	route("about", "routes/about.tsx"), // About Us ページ（/about）
	route("services", "routes/services.tsx"), // サービス紹介ページ（/services）
	route("contact", "routes/contact.tsx"), // お問い合わせページ（/contact）

	// プライバシー関連のネストされたルート構造
	// この部分はネストルーティングの責務: 階層的なURL構造とナビゲーションを提供
	route("privacy", "routes/privacy.tsx", [
		index("routes/privacy/index.tsx"), // /privacy - プライバシーポリシーのトップページ
		route("policy", "routes/privacy/policy.tsx"), // /privacy/policy - プライバシーポリシー詳細
		route("docs", "routes/privacy/docs.tsx"), // /privacy/docs - プライバシー関連ドキュメント
	]),

	// キャッチオールルート - 存在しないパスを404エラーとして処理
	// この部分は404ハンドリングの責務: 定義されていないルートへのアクセスを適切に処理
	route("*", "routes/catch-all.tsx"), // 全ての未定義ルート
] satisfies RouteConfig;

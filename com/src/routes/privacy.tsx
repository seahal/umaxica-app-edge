import { Outlet, NavLink, Link, useLocation } from "react-router";
import type { Route } from "../../src/routes/+types/privacy";

// メタ情報の責務: プライバシーセクションのSEO対応メタデータを定義
// テストではこう確認する: title と description が正しく設定されるかをテスト
export function meta(_: Route.MetaArgs) {
	return [
		{ title: "プライバシー - Umaxica" },
		{
			name: "description",
			content:
				"Umaxicaのプライバシーポリシー、データ保護方針、および関連ドキュメントをご確認いただけます。",
		},
	];
}

// パンくずナビゲーションコンポーネント
// この部分はパンくずナビゲーションの責務: ユーザーの現在位置とナビゲーション経路を表示
// テストではこう確認する: 現在のパスに応じて適切なパンくずが表示されるかをテスト
function Breadcrumb() {
	const location = useLocation();
	const pathSegments = location.pathname.split("/").filter(Boolean);

	// パンくずアイテムの生成
	const breadcrumbItems = [
		{ path: "/", label: "ホーム", icon: "🏠" },
		{ path: "/privacy", label: "プライバシー", icon: "🔒" },
	];

	// 現在のパスに応じてサブページを追加
	if (pathSegments.includes("policy")) {
		breadcrumbItems.push({
			path: "/privacy/policy",
			label: "プライバシーポリシー",
			icon: "📋",
		});
	} else if (pathSegments.includes("docs")) {
		breadcrumbItems.push({
			path: "/privacy/docs",
			label: "ドキュメント",
			icon: "📚",
		});
	}

	return (
		<nav aria-label="パンくずナビゲーション" className="py-4">
			<ol className="flex items-center space-x-2 text-sm">
				{breadcrumbItems.map((item, index) => (
					<li key={item.path} className="flex items-center">
						{index > 0 && <span className="mx-2 text-gray-400">→</span>}
						{index === breadcrumbItems.length - 1 ? (
							// 現在のページは非アクティブなテキスト
							<span className="text-gray-600 flex items-center">
								<span className="mr-1">{item.icon}</span>
								{item.label}
							</span>
						) : (
							// 他のページはリンク（Linkコンポーネントのデモ）
							<Link
								to={item.path}
								className="text-blue-600 hover:text-blue-800 hover:underline flex items-center transition-colors duration-200"
							>
								<span className="mr-1">{item.icon}</span>
								{item.label}
							</Link>
						)}
					</li>
				))}
			</ol>
		</nav>
	);
}

// プライバシーセクションのサイドナビゲーション
// この部分はセクションナビゲーションの責務: プライバシー関連ページ間のナビゲーションを提供
// テストではこう確認する: NavLinkのアクティブ状態が正しく動作するかをテスト
function PrivacyNavigation() {
	return (
		<nav className="w-64 bg-white shadow-sm border-r border-gray-200 p-6">
			<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
				<span className="mr-2">🔒</span>
				プライバシー
			</h3>

			<ul className="space-y-2">
				{/* NavLinkのデモ - 様々なスタイリングパターン */}
				<li>
					<NavLink
						to="/privacy"
						end // 完全一致のみアクティブにする（子ルートではアクティブにしない）
						className={({ isActive, isPending }) =>
							`block w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
								isActive
									? "bg-blue-100 text-blue-700 border-l-4 border-blue-500 shadow-sm"
									: isPending
										? "bg-gray-100 text-gray-600"
										: "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
							}`
						}
					>
						{({ isActive }) => (
							<span className="flex items-center">
								<span className="mr-3">{isActive ? "📍" : "📄"}</span>
								概要
								{isActive && (
									<span className="ml-auto text-xs">現在のページ</span>
								)}
							</span>
						)}
					</NavLink>
				</li>

				<li>
					<NavLink
						to="/privacy/policy"
						className={({ isActive, isPending }) =>
							`block w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
								isActive
									? "bg-green-100 text-green-700 border-l-4 border-green-500 shadow-sm"
									: isPending
										? "bg-gray-100 text-gray-600 animate-pulse"
										: "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
							}`
						}
					>
						{({ isActive, isPending }) => (
							<span className="flex items-center">
								<span className="mr-3">
									{isPending ? "⏳" : isActive ? "📋" : "📝"}
								</span>
								プライバシーポリシー
								{isPending && (
									<span className="ml-auto text-xs">読み込み中</span>
								)}
								{isActive && <span className="ml-auto text-xs">表示中</span>}
							</span>
						)}
					</NavLink>
				</li>

				<li>
					<NavLink
						to="/privacy/docs"
						className={({ isActive, isPending }) => {
							// 動的なクラス名の生成（NavLinkの高度な使用例）
							const baseClasses =
								"block w-full text-left px-4 py-3 rounded-lg transition-all duration-200 relative";

							if (isActive) {
								return `${baseClasses} bg-purple-100 text-purple-700 border-l-4 border-purple-500 shadow-sm transform scale-[1.02]`;
							} else if (isPending) {
								return `${baseClasses} bg-gray-100 text-gray-600`;
							} else {
								return `${baseClasses} text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:transform hover:scale-105`;
							}
						}}
					>
						{({ isActive }) => (
							<span className="flex items-center">
								<span className="mr-3">{isActive ? "📚" : "📖"}</span>
								関連ドキュメント
								{isActive && (
									<>
										<span className="ml-auto text-xs">閲覧中</span>
										<span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse"></span>
									</>
								)}
							</span>
						)}
					</NavLink>
				</li>
			</ul>

			{/* 追加のナビゲーション要素 */}
			<div className="mt-8 p-4 bg-blue-50 rounded-lg">
				<h4 className="text-sm font-medium text-blue-900 mb-2">関連ページ</h4>
				<div className="space-y-2 text-sm">
					{/* Linkコンポーネントの様々な使用例 */}
					<Link
						to="/about"
						className="block text-blue-700 hover:text-blue-900 hover:underline"
					>
						→ 会社概要
					</Link>
					<Link
						to="/contact"
						className="block text-blue-700 hover:text-blue-900 hover:underline"
					>
						→ お問い合わせ
					</Link>

					{/* 外部リンクの例（従来のaタグとの比較） */}
					<a
						href="https://www.ppc.go.jp/"
						target="_blank"
						rel="noopener noreferrer"
						className="block text-blue-700 hover:text-blue-900 hover:underline"
					>
						→ 個人情報保護委員会 ↗
					</a>
				</div>
			</div>
		</nav>
	);
}

// メインのプライバシーレイアウトコンポーネント
// この部分はレイアウト構成の責務: ネストしたルートの共通レイアウトを提供
// テストではこう確認する: Outlet が適切に機能し、ナビゲーションが表示されるかをテスト
export default function PrivacyLayout() {
	return (
		<div className="bg-gray-50 min-h-screen">
			{/* ヘッダーセクション */}
			<div className="bg-white border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="py-6">
						<h1 className="text-3xl font-bold text-gray-900 flex items-center">
							<span className="mr-3">🔒</span>
							プライバシーとデータ保護
						</h1>
						<p className="mt-2 text-lg text-gray-600">
							お客様の個人情報保護に関する取り組みと方針について
						</p>

						{/* パンくずナビゲーション */}
						<Breadcrumb />
					</div>
				</div>
			</div>

			{/* メインコンテンツエリア */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="flex gap-8">
					{/* サイドナビゲーション */}
					<PrivacyNavigation />

					{/* メインコンテンツ（子ルートが表示される）*/}
					<main className="flex-1 bg-white rounded-lg shadow-sm p-8">
						{/* Outlet: ネストした子ルートのコンテンツがここに表示される */}
						<Outlet />
					</main>
				</div>
			</div>

			{/* フッターセクション（リンクの例） */}
			<footer className="bg-white border-t border-gray-200 mt-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					<div className="flex justify-between items-center text-sm text-gray-600">
						<div className="flex space-x-4">
							<Link
								to="/privacy"
								className="hover:text-blue-600 transition-colors"
							>
								プライバシートップ
							</Link>
							<Link
								to="/privacy/policy"
								className="hover:text-blue-600 transition-colors"
							>
								ポリシー詳細
							</Link>
							<Link
								to="/privacy/docs"
								className="hover:text-blue-600 transition-colors"
							>
								関連資料
							</Link>
						</div>
						<div>
							<a
								href="/"
								className="text-blue-600 hover:text-blue-800 font-medium"
							>
								← ホームに戻る
							</a>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}

("use client");
console.log("aaa");

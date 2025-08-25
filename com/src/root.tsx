import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	NavLink,
} from "react-router";

import type { Route } from "../src/+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

// ナビゲーションコンポーネントの責務: グローバルなナビゲーション機能を提供
// テストではこう確認する: 各リンクが正しいpathを持っているか、アクティブ状態が正しく設定されるかをテスト
function Navigation() {
	const navItems = [
		{ to: "/", label: "Home" },
		{ to: "/about", label: "About" },
		{ to: "/services", label: "Services" },
		{ to: "/privacy", label: "Privacy" },
		{ to: "/contact", label: "Contact" },
	];

	return (
		<nav className="bg-white shadow-lg border-b border-gray-200">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between h-16">
					<div className="flex items-center">
						<div className="flex-shrink-0">
							{/* ロゴの責務: ブランドアイデンティティを表示 */}
							<h1 className="text-xl font-bold text-blue-600">Umaxica</h1>
						</div>
					</div>
					<div className="flex space-x-8">
						{navItems.map((item) => (
							<NavLink
								key={item.to}
								to={item.to}
								className={({ isActive }) =>
									`inline-flex items-center px-1 pt-1 text-sm font-medium ${
										isActive
											? "text-blue-600 border-b-2 border-blue-600"
											: "text-gray-500 hover:text-gray-700 hover:border-gray-300"
									}`
								}
							>
								{item.label}
							</NavLink>
						))}
					</div>
				</div>
			</div>
		</nav>
	);
}

export default function App() {
	// アプリケーションの責務: 全体のレイアウト構造を定義し、共通コンポーネントを配置
	// テストではこう確認する: Navigation コンポーネントがレンダリングされ、Outlet が適切に機能するかをテスト
	return (
		<div className="min-h-screen bg-gray-50">
			<Navigation />
			<main className="flex-1">
				<Outlet />
			</main>
		</div>
	);
}

// エラーバウンダリの責務: アプリケーション全体のエラーをキャッチし、適切なエラーページを表示
// テストではこう確認する: 各種エラー（404、500、その他）に対して適切なUIが表示されるかをテスト
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	// React Router の isRouteErrorResponse を使用してルートエラーを識別
	if (isRouteErrorResponse(error)) {
		// 404エラーの場合
		if (error.status === 404) {
			// 動的インポートを使用してコンポーネントを遅延読み込み
			const { NotFoundPage } = require("./components/ErrorPage");
			return <NotFoundPage />;
		}

		// 500番台のサーバーエラーの場合
		if (error.status >= 500) {
			const { InternalServerErrorPage } = require("./components/ErrorPage");
			return (
				<InternalServerErrorPage
					details={
						error.statusText || `HTTP ${error.status} エラーが発生しました`
					}
					showDetails={import.meta.env.DEV}
				/>
			);
		}

		// 503 Service Unavailable の場合
		if (error.status === 503) {
			const { ServiceUnavailablePage } = require("./components/ErrorPage");
			return <ServiceUnavailablePage />;
		}

		// その他のHTTPエラー（400番台など）
		const { ErrorPage } = require("./components/ErrorPage");
		return (
			<ErrorPage
				status={error.status}
				title={`${error.status} エラー`}
				message={
					error.statusText || "リクエストの処理中にエラーが発生しました。"
				}
				suggestion="時間をおいて再度お試しいただくか、お問い合わせフォームからご連絡ください。"
				showNavigation={true}
			/>
		);
	}

	// JavaScript エラー（予期しないエラー）の場合
	if (error instanceof Error) {
		const { InternalServerErrorPage } = require("./components/ErrorPage");
		return (
			<InternalServerErrorPage
				details={error.message}
				stack={import.meta.env.DEV ? error.stack : undefined}
				showDetails={import.meta.env.DEV}
			/>
		);
	}

	// 不明なエラーの場合
	const { ErrorPage } = require("./components/ErrorPage");
	return (
		<ErrorPage
			status={500}
			title="予期しないエラー"
			message="申し訳ございません。予期しないエラーが発生しました。"
			suggestion="ページを再読み込みするか、お問い合わせフォームからご連絡ください。"
			showNavigation={true}
			showDetails={import.meta.env.DEV}
			details={import.meta.env.DEV ? String(error) : undefined}
		/>
	);
}

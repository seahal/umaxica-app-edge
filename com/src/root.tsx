import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { useLoaderData } from "react-router";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";

// 動的インポートを使用してコンポーネントを遅延読み込み

import type { JSX } from "react";
// 不明なエラーの場合
import { ErrorPage, ServiceUnavailablePage } from "./components/ErrorPage";
import { InternalServerErrorPage } from "./components/InternalServerErrorPage";
import { NotFoundPage } from "./components/NotFoundPage";

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

export const loader = async ({ context }: Route.LoaderArgs) => {
	const env =
		(context as unknown as { cloudflare?: { env?: Record<string, string> } })
			?.cloudflare?.env ?? {};
	return {
		codeName: env.CODE_NAME ?? "",
		newsUrl: env.NEWS_URL ?? "",
		docsUrl: env.DOCS_URL ?? "",
		helpUrl: env.HELP_URL ?? "",
	};
};

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<title></title>
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

export default function App() {
	// アプリケーションの責務: 全体のレイアウト構造を定義し、共通コンポーネントを配置
	// テストではこう確認する: Header コンポーネントがレンダリングされ、Outlet が適切に機能するかをテスト
	const { codeName, newsUrl, docsUrl, helpUrl } =
		useLoaderData<Awaited<ReturnType<typeof loader>>>();

	return (
		<>
			<Header
				codeName={codeName}
				newsUrl={newsUrl}
				docsUrl={docsUrl}
				helpUrl={helpUrl}
			/>
			<main>
				<Outlet />
			</main>
			<Footer codeName={codeName} />
		</>
	);
}

// エラーバウンダリの責務: アプリケーション全体のエラーをキャッチし、適切なエラーページを表示
// テストではこう確認する: 各種エラー（404、500、その他）に対して適切なUIが表示されるかをテスト
export function ErrorBoundary({
	error,
}: Route.ErrorBoundaryProps): JSX.Element {
	// React Router の isRouteErrorResponse を使用してルートエラーを識別
	if (isRouteErrorResponse(error)) {
		const rr = error as { status: number; statusText?: string };
		// 404エラーの場合
		if (rr.status === 404) {
			return <NotFoundPage />;
		}

		// 500番台のサーバーエラーの場合
		if (rr.status >= 500) {
			return (
				<InternalServerErrorPage
					details={rr.statusText || `HTTP ${rr.status} エラーが発生しました`}
					showDetails={import.meta.env.DEV}
				/>
			);
		}

		// 503 Service Unavailable の場合
		if (rr.status === 503) {
			return <ServiceUnavailablePage />;
		}

		// その他のHTTPエラー（400番台など）

		return (
			<ErrorPage
				status={rr.status}
				title={`${rr.status} エラー`}
				message={rr.statusText || "リクエストの処理中にエラーが発生しました。"}
				suggestion="時間をおいて再度お試しいただくか、お問い合わせフォームからご連絡ください。"
				showNavigation={true}
			/>
		);
	}

	// JavaScript エラー（予期しないエラー）の場合
	if (error instanceof Error) {
		return (
			<InternalServerErrorPage
				details={error.message}
				stack={import.meta.env.DEV ? error.stack : undefined}
				showDetails={import.meta.env.DEV}
			/>
		);
	}
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

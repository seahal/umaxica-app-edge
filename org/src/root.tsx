import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
	useRouteLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ErrorPage, ServiceUnavailablePage } from "./components/ErrorPage";
import { InternalServerErrorPage } from "./components/InternalServerErrorPage";
import { NotFoundPage } from "./components/NotFoundPage";

import type { JSX } from "react";

// 既定のメタ情報（各ページで未指定の場合のデフォルト）
export function meta() {
	return [{ title: "Umaxica" }];
}

export const links: Route.LinksFunction = () => [];

export function Layout({ children }: { children: React.ReactNode }) {
	const rootData =
		useRouteLoaderData<Awaited<ReturnType<typeof loader>>>("root");
	const nonce = rootData?.cspNonce;
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
				<ScrollRestoration nonce={nonce} />
				<Scripts nonce={nonce} />
			</body>
		</html>
	);
}

export default function App() {
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
			<Outlet />
			<Footer codeName={codeName} />
		</>
	);
}

export function ErrorBoundary({
	error,
}: Route.ErrorBoundaryProps): JSX.Element {
	if (isRouteErrorResponse(error)) {
		const rr = error as { status: number; statusText?: string };

		if (rr.status === 404) {
			return <NotFoundPage />;
		}

		if (rr.status >= 500) {
			return (
				<InternalServerErrorPage
					details={rr.statusText || `HTTP ${rr.status} エラーが発生しました`}
					showDetails={import.meta.env.DEV}
				/>
			);
		}

		if (rr.status === 503) {
			return <ServiceUnavailablePage />;
		}

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

export const loader = async ({ context }: Route.LoaderArgs) => {
	const { cloudflare, security } =
		(context as unknown as {
			cloudflare?: { env?: Record<string, string> };
			security?: { nonce?: string };
		}) ?? {};
	const env = cloudflare?.env ?? {};
	const cspNonce = security?.nonce ?? "";
	return {
		codeName: env.CODE_NAME ?? "",
		newsUrl: env.NEWS_STAFF_URL ?? "",
		docsUrl: env.DOCS_STAFF_URL ?? "",
		helpUrl: env.HELP_STAFF_URL ?? "",
		cspNonce,
	};
};

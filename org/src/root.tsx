import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from "react-router";
import { ErrorPage, ServiceUnavailablePage } from "./components/ErrorPage";
import { InternalServerErrorPage } from "./components/InternalServerErrorPage";
import { NotFoundPage } from "./components/NotFoundPage";
import "./app.css";
import { CloudflareContext } from "./context";

import type { JSX, ReactNode } from "react";
import type { Route } from "./+types/root";

// 既定のメタ情報（各ページで未指定の場合のデフォルト）
export function meta() {
	return [{ title: "Umaxica" }];
}

export const links: Route.LinksFunction = () => [];

export function Layout({ children }: { children: ReactNode }) {
	const { cspNonce } = useLoaderData<Awaited<ReturnType<typeof loader>>>();
	const nonce = cspNonce || undefined;

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
	return <Outlet />;
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
		return <InternalServerErrorPage details={error.message} />;
	}

	return (
		<ErrorPage
			status={500}
			title="予期しないエラー"
			message="申し訳ございません。予期しないエラーが発生しました。"
			suggestion="ページを再読み込みするか、お問い合わせフォームからご連絡ください。"
			showNavigation={true}
		/>
	);
}

export async function loader({ context }: Route.LoaderArgs) {
	const cloudflareContext = (context as any).get?.(CloudflareContext);
	const env = cloudflareContext?.cloudflare?.env ?? ({} as Env);
	const cspNonce = cloudflareContext?.security?.nonce ?? "";

	return {
		codeName: env.BRAND_NAME ?? "",
		newsUrl: env.NEWS_STAFF_URL ?? "",
		docsUrl: env.DOCS_STAFF_URL ?? "",
		helpUrl: env.HELP_STAFF_URL ?? "",
		cspNonce,
	};
}

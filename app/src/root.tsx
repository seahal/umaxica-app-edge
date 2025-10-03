import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useRouteLoaderData,
	useLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ErrorPage, ServiceUnavailablePage } from "./components/ErrorPage";
import { InternalServerErrorPage } from "./components/InternalServerErrorPage";
import { NotFoundPage } from "./components/NotFoundPage";

import type { JSX } from "react";

export const links: Route.LinksFunction = () => [];

// 既定のメタ情報（各ページで未指定の場合のデフォルト）
export function meta({ matches }: Route.MetaArgs) {
	const siteTitle = "UMAXICA";
	const childTitle = (() => {
		if (!Array.isArray(matches)) {
			return "";
		}
		for (let index = matches.length - 1; index >= 1; index -= 1) {
			const match = matches[index] as { meta?: unknown } | null | undefined;
			const descriptors = Array.isArray(match?.meta)
				? (match?.meta as Array<{ title?: unknown }> | undefined)
				: undefined;
			if (!descriptors) {
				continue;
			}
			for (const descriptor of descriptors) {
				if (!descriptor || typeof descriptor !== "object") {
					continue;
				}
				const rawTitle = (descriptor as { title?: unknown }).title;
				if (typeof rawTitle !== "string") {
					continue;
				}
				const trimmed = rawTitle.trim();
				if (trimmed.length > 0) {
					return trimmed;
				}
			}
		}
		return "";
	})();

	if (!childTitle) {
		return [{ title: siteTitle }];
	}

	if (childTitle.toLowerCase().startsWith(siteTitle.toLowerCase())) {
		return [{ title: childTitle }];
	}

	return [{ title: `${siteTitle} | ${childTitle}` }];
}

export function Layout({ children }: { children: React.ReactNode }) {
	const _rootData =
		useRouteLoaderData<Awaited<ReturnType<typeof loader>>>("root");
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

export default function App() {
	const {
		codeName,
		apiServiceUrl,
		edgeServiceUrl,
		helpServiceUrl,
		docsServiceUrl,
		newsServiceUrl,
	} = useLoaderData<Awaited<ReturnType<typeof loader>>>();
	return (
		<>
			<Header
				codeName={codeName}
				apiServiceUrl={apiServiceUrl}
				edgeServiceUrl={edgeServiceUrl}
				helpServiceUrl={helpServiceUrl}
				docsServiceUrl={docsServiceUrl}
				newsServiceUrl={newsServiceUrl}
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
		helpServiceUrl: env.HELP_SERVICE_URL ?? "",
		docsServiceUrl: env.DOCS_SERVICE_URL ?? "",
		newsServiceUrl: env.NEWS_SERVICE_URL ?? "",
		apiServiceUrl: env.API_SERVICE_URL ?? "",
		apexServiceUrl: env.APEX_SERVICE_URL ?? "",
		edgeServiceUrl: env.EDGE_SERVICE_URL ?? "",
		cspNonce,
	};
};

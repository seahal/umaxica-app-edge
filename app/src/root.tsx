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

export const links: Route.LinksFunction = () => [];

// 既定のメタ情報（各ページで未指定の場合のデフォルト）
export function meta() {
	return [{ title: "Umaxica" }];
}

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
				<ScrollRestoration />
				<Scripts />
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

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		const routeError = error as { status: number; statusText?: string };
		message = routeError.status === 404 ? "404" : "Error";
		details =
			routeError.status === 404
				? "The requested page could not be found."
				: routeError.statusText || details;
	} else if (import.meta.env.DEV && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="pt-16 p-4 container mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
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
		newsUrl: env.NEWS_URL ?? "",
		docsUrl: env.DOCS_URL ?? "",
		helpUrl: env.HELP_URL ?? "",
		cspNonce,
	};
};

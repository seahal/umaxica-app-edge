import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from "react-router";

import "./app.css";
import type { Route } from "./+types/root";
import type { ReactNode } from "react";
import { CloudflareContext } from "./context";

type RouteErrorBoundaryProps = {
	error: unknown;
};
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

const FALLBACK_SETTINGS = {
	codeName: "Umaxica Developers",
	helpServiceUrl: "",
	docsServiceUrl: "",
	newsServiceUrl: "",
} as const;

function generateNonce(): string {
	const array = new Uint8Array(16);
	crypto.getRandomValues(array);
	return btoa(String.fromCharCode(...array));
}

// Note: middleware is not available in React Router v7
// Nonce generation is handled directly in the loader

export function loader({ context }: Route.LoaderArgs) {
	// Get nonce from CloudflareContext set by entry.server.tsx middleware
	const cloudflareContext = (context as any).get?.(CloudflareContext);
	const cspNonce = cloudflareContext?.security?.nonce ?? generateNonce();

	const contextEnv = cloudflareContext?.cloudflare?.env ?? {};
	const importEnv =
		(
			import.meta as ImportMeta & {
				env?: Record<string, string | undefined>;
			}
		).env ?? {};

	const readEnv = (key: string, fallback = ""): string => {
		const fromContext = contextEnv[key];
		if (fromContext !== undefined) {
			return fromContext.trim();
		}

		const fromImport = importEnv[key] ?? importEnv[`VITE_${key}`];
		if (fromImport !== undefined) {
			return fromImport.trim();
		}

		return fallback.trim();
	};

	const codeName = readEnv("BRAND_NAME", FALLBACK_SETTINGS.codeName);
	const helpServiceUrl = readEnv(
		"HELP_SERVICE_URL",
		FALLBACK_SETTINGS.helpServiceUrl,
	);
	const docsServiceUrl = readEnv(
		"DOCS_SERVICE_URL",
		FALLBACK_SETTINGS.docsServiceUrl,
	);
	const newsServiceUrl = readEnv(
		"NEWS_SERVICE_URL",
		FALLBACK_SETTINGS.newsServiceUrl,
	);

	return { cspNonce, codeName, helpServiceUrl, docsServiceUrl, newsServiceUrl };
}

export function ErrorBoundary({ error }: RouteErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
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

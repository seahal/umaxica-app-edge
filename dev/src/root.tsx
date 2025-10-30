import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from "react-router";

import { SpeedInsights } from "@vercel/speed-insights/react";

import "./app.css";

import type { Route } from "./+types/root";
import type { ReactNode } from "react";

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
				<SpeedInsights />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}

function generateNonce(): string {
	const array = new Uint8Array(16);
	crypto.getRandomValues(array);
	return btoa(String.fromCharCode(...array));
}

export function loader({ context }: Route.LoaderArgs) {
	// Generate nonce if not provided by context
	const cspNonce = context?.security?.nonce ?? generateNonce();

	// Store nonce in context for entry.server.tsx to use
	if (context && !context.security) {
		Object.assign(context, { security: { nonce: cspNonce } });
	} else if (context?.security && !context.security.nonce) {
		Object.assign(context.security, { nonce: cspNonce });
	}

	return { cspNonce };
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

import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";

import type { ReactNode } from "react";

// 既定のメタ情報（各ページで未指定の場合のデフォルト）
export function meta(_: Route.MetaArgs) {
	return [{ title: "" }];
}

export function Layout({ children }: { children: ReactNode }) {
	const { cspNonce } = useLoaderData<Awaited<ReturnType<typeof loader>>>();
	const nonce = cspNonce || undefined;

	return (
		<html lang="ja">
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

export async function loader({ context }: Route.LoaderArgs) {
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
}

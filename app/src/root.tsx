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
import { CloudflareContext } from "./context";

import type { ReactNode } from "react";

// 既定のメタ情報（各ページで未指定の場合のデフォルト）
export function meta(_: Route.MetaArgs) {
	return [{ title: "" }];
}

export function Layout({ children }: { children: ReactNode }) {
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
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	const data = useLoaderData<typeof loader>();
	// Layoutにnonceを渡すため、data.cspNonceを環境変数として設定
	// ただし、Layoutコンポーネントはこの値を直接使えないため、
	// entry.server.tsxでnonceを処理
	return <Outlet />;
}

export async function loader({ context }: Route.LoaderArgs) {
	const cloudflareContext = context.get(CloudflareContext);
	const env = cloudflareContext?.cloudflare.env ?? ({} as Env);
	const cspNonce = cloudflareContext?.security?.nonce ?? "";

	return {
		codeName: env.BRAND_NAME ?? "",
		helpServiceUrl: env.HELP_SERVICE_URL ?? "",
		docsServiceUrl: env.DOCS_SERVICE_URL ?? "",
		newsServiceUrl: env.NEWS_SERVICE_URL ?? "",
		apiServiceUrl: env.API_SERVICE_URL ?? "",
		apexServiceUrl: env.APEX_SERVICE_URL ?? "",
		edgeServiceUrl: env.EDGE_SERVICE_URL ?? "",
		cspNonce,
	};
}

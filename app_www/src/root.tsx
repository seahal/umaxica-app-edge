import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "react-router";

import type { Route } from "./+types/root";
import "./app.css";

import type { ReactNode } from "react";
import { getEnv, getNonce } from "./context";

// 既定のメタ情報（各ページで未指定の場合のデフォルト）
export function meta(_: Route.MetaArgs) {
  return [{ title: "" }];
}

export function Layout({ children }: { children: ReactNode }) {
  const loaderData = useLoaderData<Awaited<ReturnType<typeof loader>>>();
  const nonce = loaderData.cspNonce || undefined;

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
  // Loaderのデータを取得して各レイアウトへ伝播させる
  useLoaderData<typeof loader>();
  return <Outlet />;
}

export async function loader({ context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const cspNonce = getNonce(context);

  return {
    codeName: env.BRAND_NAME ?? "",
    helpServiceUrl: env.HELP_SERVICE_URL ?? "",
    docsServiceUrl: env.DOCS_SERVICE_URL ?? "",
    newsServiceUrl: env.NEWS_SERVICE_URL ?? "",
    apiServiceUrl: env.API_SERVICE_URL ?? "",
    apexServiceUrl: env.APEX_SERVICE_URL ?? "",
    edgeServiceUrl: env.EDGE_SERVICE_URL ?? "",
    cspNonce,
    sentryDsn: env.SENTRY_DNC ?? "",
  };
}

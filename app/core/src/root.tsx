import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from 'react-router';
import type { RouterContextProvider } from './context';

import type { Route } from './+types/root';
import './app.css';

import type { ReactNode } from 'react';
import { CloudflareContext, getEnv, getNonce } from './context';

// Local definition of MiddlewareFunction since the export from react-router might not be picked up correctly by all tools
type MiddlewareFunction = (
  args: {
    context: RouterContextProvider;
    request: Request;
  },
  next: () => Promise<Response> | Response,
) => Promise<Response> | Response;

// 既定のメタ情報（各ページで未指定の場合のデフォルト）
export function meta(_: Route.MetaArgs) {
  return [{ title: '' }];
}

export function Layout({ children }: { children: ReactNode }) {
  const loaderData = useLoaderData<Awaited<ReturnType<typeof loader>>>();
  const nonce = loaderData.cspNonce || undefined;
  const publicEnv = {
    SENTRY_DSN: loaderData.sentryDsn,
    SENTRY_ENVIRONMENT: loaderData.sentryEnvironment,
  };
  const serializedPublicEnv = JSON.stringify(publicEnv).replace(/</g, '\\u003c');

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
        <script
          nonce={nonce}
          suppressHydrationWarning
        >{`window.ENV=${serializedPublicEnv};`}</script>
        <ScrollRestoration {...(nonce ? { nonce } : {})} />
        <Scripts {...(nonce ? { nonce } : {})} />
      </body>
    </html>
  );
}

export default function App() {
  // Loaderのデータを取得して各レイアウトへ伝播させる
  useLoaderData<typeof loader>();
  return <Outlet />;
}

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCodePoint(...bytes));
}

const securityContextMiddleware: MiddlewareFunction = ({ context }, next) => {
  const currentContext = context.get(CloudflareContext) ?? {};
  const currentNonce = currentContext.security?.nonce;

  if (!currentNonce) {
    context.set(CloudflareContext, {
      ...currentContext,
      security: {
        ...currentContext.security,
        nonce: generateNonce(),
      },
    });
  }

  return next();
};

export const middleware: MiddlewareFunction[] = [securityContextMiddleware];

export function loader({ context }: Route.LoaderArgs) {
  const env = getEnv(context) as unknown as Record<string, string | undefined>;
  const cspNonce = getNonce(context);

  return {
    apexServiceUrl: env.APEX_SERVICE_URL ?? '',
    apiServiceUrl: env.API_SERVICE_URL ?? '',
    codeName: env.BRAND_NAME ?? '',
    cspNonce,
    docsServiceUrl: env.DOCS_SERVICE_URL ?? '',
    edgeServiceUrl: env.EDGE_SERVICE_URL ?? '',
    helpServiceUrl: env.HELP_SERVICE_URL ?? '',
    newsServiceUrl: env.NEWS_SERVICE_URL ?? '',
    sentryDsn: env.SENTRY_DSN ?? '',
    sentryEnvironment: env.SENTRY_ENVIRONMENT ?? '',
  };
}

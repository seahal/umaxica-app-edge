import * as Sentry from '@sentry/react-router';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLoaderData,
} from 'react-router';

import './app.css';
import type { ReactNode } from 'react';
import type { Route } from './+types/root';
import { getNonce, readEnv } from './context';

interface RouteErrorBoundaryProps {
  error: unknown;
}

function isDevEnvironment(): boolean {
  const importMeta = import.meta as ImportMeta & { env?: Record<string, unknown> };
  return importMeta.env?.['DEV'] === true;
}

export const links: Route.LinksFunction = () => [
  { href: 'https://fonts.googleapis.com', rel: 'preconnect' },
  {
    crossOrigin: 'anonymous',
    href: 'https://fonts.gstatic.com',
    rel: 'preconnect',
  },
  {
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
    rel: 'stylesheet',
  },
];

export function Layout({ children }: { children: ReactNode }) {
  const { cspNonce, sentryDsn, sentryEnvironment } =
    useLoaderData<Awaited<ReturnType<typeof loader>>>();
  const nonce = cspNonce || undefined;
  const publicEnv = { SENTRY_DSN: sentryDsn, SENTRY_ENVIRONMENT: sentryEnvironment };
  const serializedPublicEnv = JSON.stringify(publicEnv).replace(/</g, '\\u003c');

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
        <script
          nonce={nonce}
          suppressHydrationWarning
        >{`window.ENV=${serializedPublicEnv};`}</script>
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
  codeName: 'Umaxica Developers',
  docsServiceUrl: '',
  helpServiceUrl: '',
  newsServiceUrl: '',
  sentryDsn: '',
  sentryEnvironment: 'development',
} as const;

export function loader({ context }: Route.LoaderArgs) {
  const cspNonce = getNonce(context);

  const codeName = readEnv(context, 'BRAND_NAME', FALLBACK_SETTINGS.codeName);
  const helpServiceUrl = readEnv(context, 'HELP_SERVICE_URL', FALLBACK_SETTINGS.helpServiceUrl);
  const docsServiceUrl = readEnv(context, 'DOCS_SERVICE_URL', FALLBACK_SETTINGS.docsServiceUrl);
  const newsServiceUrl = readEnv(context, 'NEWS_SERVICE_URL', FALLBACK_SETTINGS.newsServiceUrl);
  const sentryDsn = readEnv(context, 'SENTRY_DSN', FALLBACK_SETTINGS.sentryDsn);
  const sentryEnvironment = readEnv(
    context,
    'SENTRY_ENVIRONMENT',
    FALLBACK_SETTINGS.sentryEnvironment,
  );

  return {
    codeName,
    cspNonce,
    docsServiceUrl,
    helpServiceUrl,
    newsServiceUrl,
    sentryDsn,
    sentryEnvironment,
  };
}

export function ErrorBoundary({ error }: RouteErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404 ? 'The requested page could not be found.' : error.statusText || details;
  } else if (isDevEnvironment() && error && error instanceof Error) {
    Sentry.captureException(error);
    details = error.message;
    ({ stack } = error);
  } else if (error instanceof Error) {
    Sentry.captureException(error);
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

import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from 'react-router';
import type { MiddlewareFunction } from 'react-router';

import type { Route } from './+types/root';
import './app.css';

import type { JSX, ReactNode } from 'react';
import { ErrorPage, ServiceUnavailablePage } from './components/ErrorPage';
import { InternalServerErrorPage } from './components/InternalServerErrorPage';
import { NotFoundPage } from './components/NotFoundPage';
import { CloudflareContext, getEnv, getNonce } from './context';

const isDevEnvironment = import.meta.env.DEV;

export function meta() {
  return [{ title: 'Umaxica' }];
}

export const links: Route.LinksFunction = () => [];

export function Layout({ children }: { children: ReactNode }) {
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

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps): JSX.Element {
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
        message={rr.statusText || 'リクエストの処理中にエラーが発生しました。'}
        suggestion="時間をおいて再度お試しいただくか、お問い合わせフォームからご連絡ください。"
        showNavigation
      />
    );
  }

  if (error instanceof Error) {
    return (
      <InternalServerErrorPage
        details={error.message}
        stack={isDevEnvironment ? error.stack : undefined}
        showDetails={isDevEnvironment}
      />
    );
  }

  return (
    <ErrorPage
      status={500}
      title="予期しないエラー"
      message="申し訳ございません。予期しないエラーが発生しました。"
      suggestion="ページを再読み込みするか、お問い合わせフォームからご連絡ください。"
      showNavigation
    />
  );
}

export function loader({ context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const cspNonce = getNonce(context);

  return {
    codeName: env.BRAND_NAME ?? '',
    cspNonce,
    docsServiceUrl: env.DOCS_CORPORATE_URL ?? '',
    helpServiceUrl: env.HELP_CORPORATE_URL ?? '',
    newsServiceUrl: env.NEWS_CORPORATE_URL ?? '',
  };
}

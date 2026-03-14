import * as Sentry from '@sentry/react-router';
import { StrictMode, startTransition } from 'react';
import type { ErrorInfo } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';

declare global {
  interface Window {
    ENV: {
      sentryDsn?: string;
      SENTRY_ENVIRONMENT?: string;
    };
  }
}

if (window.ENV?.sentryDsn) {
  Sentry.init({
    dsn: window.ENV.sentryDsn,
    environment: window.ENV.SENTRY_ENVIRONMENT,
    enableLogs: true,
    integrations: [Sentry.reactRouterTracingIntegration(), Sentry.browserProfilingIntegration()],
    profilesSampleRate: 1.0,
    sendDefaultPii: true,
    tracesSampleRate: 1.0,
  });
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter
        {...({
          unstable_onError: (error: unknown, errorInfo: ErrorInfo) => {
            Sentry.captureReactException(error, errorInfo);
          },
        } as Record<string, unknown>)}
      />
    </StrictMode>,
  );
});

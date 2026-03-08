import * as Sentry from '@sentry/react-router';
import { StrictMode, startTransition } from 'react';
import type { ErrorInfo } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';

declare global {
  interface Window {
    ENV: {
      SENTRY_DSN?: string;
    };
  }
}

if (window.ENV?.SENTRY_DSN) {
  Sentry.init({
    dsn: window.ENV.SENTRY_DSN,
    integrations: [Sentry.reactRouterTracingIntegration(), Sentry.browserProfilingIntegration()],
    profilesSampleRate: 1.0,
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

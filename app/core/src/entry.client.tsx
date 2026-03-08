import * as Sentry from '@sentry/react-router';
import { StrictMode, startTransition } from 'react';
import type { ErrorInfo } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';

// サーバーから埋め込まれた環境変数を取得
declare global {
  interface Window {
    ENV: {
      SENTRY_DSN?: string;
      SENTRY_ENVIRONMENT?: string;
    };
  }
}

// Sentry DSN が設定されている場合のみ初期化
if (window.ENV?.SENTRY_DSN) {
  Sentry.init({
    dsn: window.ENV.SENTRY_DSN,
    environment: window.ENV.SENTRY_ENVIRONMENT,
    integrations: [Sentry.reactRouterTracingIntegration(), Sentry.browserProfilingIntegration()],
    sendDefaultPii: true,
    enableLogs: true,
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

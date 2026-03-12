import * as Sentry from '@sentry/node';

let sentryInitialized = false;

function readEnv(key: string): string | undefined {
  return process.env[key]?.trim() || undefined;
}

export function initObservability() {
  const dsn = readEnv('SENTRY_DSN');
  if (sentryInitialized || !dsn) {
    return;
  }

  Sentry.init({
    dsn: dsn as string,
    environment: readEnv('SENTRY_ENVIRONMENT') ?? 'development',
    enableLogs: true,
    profilesSampleRate: 1.0,
    sendDefaultPii: true,
    tracesSampleRate: 1.0,
  });
  sentryInitialized = true;
}

export function captureException(
  error: unknown,
  context?: {
    request?: {
      method: string;
      url: string;
    };
  },
) {
  if (!readEnv('SENTRY_DSN')) {
    return;
  }

  initObservability();
  Sentry.withScope((scope: Sentry.Scope) => {
    if (context?.request) {
      scope.setContext('request', context.request);
    }
    Sentry.captureException(error);
  });
}

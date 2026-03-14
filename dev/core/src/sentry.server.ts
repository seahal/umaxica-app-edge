import * as Sentry from '@sentry/react-router';

let sentryInitialized = false;

function readEnv(key: string): string | undefined {
  const processEnv =
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
  const value = processEnv[key] ?? processEnv[`VITE_${key}`];
  return value?.trim() || undefined;
}

export function initServerSentry() {
  const dsn = readEnv('UMAXICA_APPS_EDGE_DEV_CORE_SENTRY_DSN');
  if (sentryInitialized || !dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: readEnv('SENTRY_ENVIRONMENT') ?? 'development',
    enableLogs: true,
    sendDefaultPii: true,
    tracesSampleRate: 1.0,
  });
  sentryInitialized = true;
}

// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { captureRouterTransitionStart, init, replayIntegration } from '@sentry/nextjs';

const dsn = process.env['NEXT_PUBLIC_SENTRY_DSN'];

if (dsn) {
  init({
    dsn,

    // Add optional integrations for additional features
    integrations: [replayIntegration()],

    // Explicitly false rather than omitted, even though false is the default:
    // `dev/acme/test/application-shell.test.tsx` asserts it, which is what makes
    // "this app sends no default PII to Sentry" a checked property instead of a
    // claim. @sentry/nextjs v10 deprecates the option in favour of per-category
    // `dataCollection` and removes it in v11 — moving to that spelling is a
    // Sentry upgrade with its own decision to make, not a lint fix, so
    // `typescript/no-deprecated` is scoped off for these three files until then.
    sendDefaultPii: false,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

    // Define how likely Replay events are sampled.
    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,

    // Define how likely Replay events are sampled when an error occurs.
    replaysOnErrorSampleRate: 1.0,
  });
}

export const onRouterTransitionStart = captureRouterTransitionStart;

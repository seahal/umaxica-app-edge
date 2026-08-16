// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const dsn = process.env['SENTRY_DSN'];

if (dsn) {
  Sentry.init({
    dsn,
    // Explicitly false rather than omitted, even though false is the default:
    // `dev/acme/test/application-shell.test.tsx` asserts it, which is what makes
    // "this app sends no default PII to Sentry" a checked property instead of a
    // claim. @sentry/nextjs v10 deprecates the option in favour of per-category
    // `dataCollection` and removes it in v11 — moving to that spelling is a
    // Sentry upgrade with its own decision to make, not a lint fix, so
    // `typescript/no-deprecated` is scoped off for these three files until then.
    sendDefaultPii: false,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  });
}

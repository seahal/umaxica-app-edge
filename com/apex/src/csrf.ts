import { csrf } from 'hono/csrf';

/*
 * This unit's own apex origin — not all five.
 *
 * The predicate used to accept `https://umaxica.{com,org,app,net,dev}` in
 * every unit, which meant this worker would have honoured a form POST
 * originating from a sibling domain. Those are separate sites: a cross-domain
 * form is not a request an apex worker has any reason to accept, and the
 * shared list only widened the surface for the day the first state-changing
 * route appears.
 */
const PRODUCTION_APEX_ORIGIN = /^https:\/\/umaxica\.com$/u;

/*
 * The local development origin, and only on a non-production deployment.
 *
 * `vite dev` and `wrangler dev` are reached at `http://com.localhost:PORT`,
 * so this has to pass there. It has no business passing on the deployed apex,
 * which speaks HTTPS only — hence the `allowLocalhost` gate rather than an
 * unconditional alternative.
 */
const LOCAL_APEX_ORIGIN = /^http:\/\/com\.localhost(?::\d+)?$/u;

/*
 * A preview URL of THIS worker, pinned to its deployed name with the optional
 * version prefix Cloudflare puts in front of it. The account subdomain is the
 * one label left open, because it is not knowable from the repository.
 *
 * The pattern this replaced was `<label>.com-apex.workers.dev`, a hostname
 * Cloudflare never issues: workers.dev names the worker in the first label and
 * the account in the second. It also predated the rename to
 * `umaxica-apps-edge-com-apex`, so it matched no real preview at all.
 */
const PREVIEW_APEX_ORIGIN =
  /^https:\/\/(?:[a-z0-9-]+-)?umaxica-apps-edge-com-apex\.[a-z0-9-]+\.workers\.dev$/u;

export type ApexOriginPolicy = {
  /** False on a production deployment; see `LOCAL_APEX_ORIGIN`. */
  allowLocalhost: boolean;
};

export const isAllowedApexOrigin = (
  origin: string | undefined,
  policy: ApexOriginPolicy,
): boolean => {
  if (!origin) {
    return false;
  }

  if (PRODUCTION_APEX_ORIGIN.test(origin) || PREVIEW_APEX_ORIGIN.test(origin)) {
    return true;
  }

  return policy.allowLocalhost && LOCAL_APEX_ORIGIN.test(origin);
};

/*
 * Read through a guard for the reason `brand.ts` gives: this middleware is
 * built outside the typed app, so Hono hands its bindings over untyped and
 * `c.env` is absent entirely under `app.request()` in the test suite.
 *
 * The default is the strict one. Anything that is not literally the string
 * `production` — a missing binding included — leaves localhost allowed only
 * where `EDGE_ENV` says the deployment is not production.
 */
const isProductionEnv = (env: unknown): boolean =>
  typeof env === 'object' && env !== null && 'EDGE_ENV' in env && env.EDGE_ENV === 'production';

export const apexCsrf = csrf({
  origin: (origin, c) => isAllowedApexOrigin(origin, { allowLocalhost: !isProductionEnv(c.env) }),
});

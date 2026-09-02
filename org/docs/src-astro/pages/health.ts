import type { APIRoute } from 'astro';

import { getEdgeBindings } from '../lib/env';
import type { RailsClient } from '../lib/rails-client';
import { getRailsClient } from '../lib/rails-client';
import { checkRailsLiveness } from '../lib/rails-health';

/*
 * The one health entry point for this frame: Edge's own state and Rails'
 * liveness in a single JSON document. Ported from `src/routes/health.ts`.
 *
 * A Rails outage makes this endpoint 503 — the deliberate reversal recorded in
 * adr/009, including that production answers 503 here until a production VPC
 * Service exists.
 *
 * `export const prerender = false` is the Astro equivalent of the TanStack unit
 * being entirely un-prerendered: this is the only page-like route that runs in
 * the Worker per request and touches the VPC binding.
 */
export const prerender = false;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'X-Robots-Tag': 'noindex, nofollow',
  'Content-Type': 'application/json; charset=utf-8',
} as const;

function getFallbackTimestamp(): string {
  const now = new Date();
  try {
    return now.toISOString();
  } catch {
    return now.toUTCString();
  }
}

function resolveRailsClient(env: ReturnType<typeof getEdgeBindings>): RailsClient | null {
  try {
    return getRailsClient(env);
  } catch {
    return null;
  }
}

export const GET: APIRoute = async () => {
  const env = getEdgeBindings();
  const rails = await checkRailsLiveness(resolveRailsClient(env));
  const railsOk = rails.liveness.kind === 'ok';

  try {
    const timestamp = new Date().toISOString();
    const { id, tag, timestamp: revisionTimestamp } = env.REVISION ?? {};

    return new Response(
      JSON.stringify({
        status: railsOk ? 'ok' : 'error',
        timestamp,
        edge: { status: 'ok', version: { id, tag, timestamp: revisionTimestamp } },
        rails,
      }),
      { status: railsOk ? 200 : 503, headers: NO_STORE_HEADERS },
    );
  } catch {
    return new Response(
      JSON.stringify({
        status: 'error',
        timestamp: getFallbackTimestamp(),
        edge: { status: 'error' },
        rails,
      }),
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
};

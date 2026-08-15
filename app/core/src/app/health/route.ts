import { connection } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { RailsClient } from '../../lib/rails-client';
import { getRailsClient } from '../../lib/rails-client';
import { checkRailsLiveness } from '../../lib/rails-health';

/*
 * The one health entry point for this frame: Edge's own state and Rails'
 * liveness in a single JSON document.
 *
 * It used to be two routes that each answered half the question. `/health`
 * reported Edge alone; `/rails-health` reported Rails alone; neither could say
 * whether the surface as a whole was serving. Worse, `/health` collided by name
 * with Rails' own `/health` while `core-dispatch.ts` blocks `/health/*` at the
 * edge, so Rails' health namespace was unreachable through the public FQDN and
 * the matching Edge path meant something else entirely. `/rails-health` is
 * gone; this is what replaced it. See
 * `adr/009-rails-health-entrypoint-and-dispatch-operability.md`.
 *
 * A Rails outage therefore makes this endpoint 503. That is a deliberate
 * reversal of the earlier "a Rails outage must not make Edge unhealthy"
 * position, recorded with its consequences in ADR 009 — including that
 * production answers 503 here until a production VPC Service exists.
 *
 * The two halves are computed independently: Rails being unreachable never
 * prevents the Edge half from being reported, and vice versa.
 */

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'X-Robots-Tag': 'noindex, nofollow',
} as const;

function getTimestamp() {
  return new Date().toISOString();
}

function getFallbackTimestamp() {
  const now = new Date();

  try {
    return now.toISOString();
  } catch {
    return now.toUTCString();
  }
}

/**
 * `getRailsClient()` reads the Cloudflare context, which can be absent. An
 * absent context is "no transport", reported as `not-configured` — not an Edge
 * fault, so it must not take the Edge half down with it.
 */
function resolveRailsClient(): RailsClient | null {
  try {
    return getRailsClient();
  } catch {
    return null;
  }
}

export async function GET() {
  // Forces dynamic rendering. A prerendered copy would freeze the timestamp at
  // build time and never contact Rails at all.
  await connection();

  const rails = await checkRailsLiveness(resolveRailsClient());
  const railsOk = rails.liveness.kind === 'ok';

  try {
    const timestamp = getTimestamp();
    const context = getCloudflareContext() as { env?: CloudflareEnv };
    const { id, tag, timestamp: revisionTimestamp } = context?.env?.REVISION ?? {};

    return Response.json(
      {
        status: railsOk ? 'ok' : 'error',
        timestamp,
        edge: {
          status: 'ok',
          version: { id, tag, timestamp: revisionTimestamp },
        },
        rails,
      },
      { status: railsOk ? 200 : 503, headers: NO_STORE_HEADERS },
    );
  } catch {
    return Response.json(
      {
        status: 'error',
        timestamp: getFallbackTimestamp(),
        edge: { status: 'error' },
        rails,
      },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}

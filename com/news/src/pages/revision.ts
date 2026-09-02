import type { APIRoute } from 'astro';

import { getEdgeBindings } from '../lib/env';

/*
 * The deployment identity, read by machines. Ported from `src/routes/revision.ts`.
 *
 * On-demand because `REVISION` (Cloudflare `version_metadata`) only exists in
 * the Workers runtime. The key set is exactly `{ id, tag, timestamp }` — an
 * added or dropped field is a breaking change and `api/standard-contract.hurl`
 * pins the count at 3.
 *
 * Plan §16 notes this could be prerendered by injecting the commit SHA at build
 * time (Workers Builds env). Left on-demand in the pilot for exact parity with
 * the TanStack unit's payload; the build-time form is a later optimisation.
 */
export const prerender = false;

export const GET: APIRoute = () => {
  let revision: { id: string | null; tag: string | null; timestamp: string | null } = {
    id: null,
    tag: null,
    timestamp: null,
  };

  try {
    const { id = null, tag = null, timestamp = null } = getEdgeBindings().REVISION ?? {};
    revision = { id, tag, timestamp };
  } catch {
    // Version metadata only exists in the Workers runtime.
  }

  return new Response(JSON.stringify(revision), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
};

import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { env } from 'cloudflare:workers';

import { createRailsClient } from '../lib/rails-client';

export const prerender = false;

const MAX_BYTES = 1024 * 1024;
const schema = z.looseObject({
  data: z.array(z.looseObject({ slug: z.string().min(1) })),
  page: z.unknown(),
});

const reply = (status: number, body: object) =>
  Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  });

export const GET: APIRoute = async () => {
  if (Reflect.get(env, 'EDGE_ENV') !== 'cms_bootstrap') return reply(404, { status: 'not_found' });
  const binding: unknown = Reflect.get(env, 'UMAXICA_APPS_EDGE_CF_WORKERS_VPC');
  if (
    typeof binding !== 'object' ||
    binding === null ||
    typeof Reflect.get(binding, 'fetch') !== 'function'
  )
    return reply(500, { status: 'configuration_error' });

  const result = await createRailsClient(
    binding as { fetch: typeof fetch },
    'http://docs.app.localhost:3000',
  ).fetch('/api/v0/entries?locale=ja&limit=1', { headers: { Accept: 'application/json' } });
  if (result.kind !== 'ok') return reply(502, { status: 'upstream_error' });
  const length = Number(result.response.headers.get('content-length'));
  if (Number.isFinite(length) && length > MAX_BYTES)
    return reply(502, { status: 'invalid_contract' });
  const bytes = new Uint8Array(await result.response.arrayBuffer());
  if (bytes.byteLength > MAX_BYTES) return reply(502, { status: 'invalid_contract' });
  try {
    const parsed = schema.safeParse(JSON.parse(new TextDecoder().decode(bytes)) as unknown);
    if (!parsed.success) return reply(502, { status: 'invalid_contract' });
    return reply(200, {
      status: 'ok',
      count: parsed.data.data.length,
      first_slug: parsed.data.data[0]?.slug ?? null,
    });
  } catch {
    return reply(502, { status: 'invalid_contract' });
  }
};

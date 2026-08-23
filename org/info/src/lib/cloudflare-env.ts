import { env } from 'cloudflare:workers';

/*
 * The one place this unit reads a Cloudflare binding.
 *
 * The runtime's own `cloudflare:workers` module, which Cloudflare documents as
 * "the canonical way to read env from anywhere — including module scope" on
 * Workers. It is not an async-local lookup, so it cannot throw for being called
 * outside a request, and the callers below say so.
 *
 * Keeping it behind one module is what lets the Vitest suite substitute a plain
 * object for the runtime (`vitest.config.ts` aliases `cloudflare:workers`, which
 * Node cannot resolve). Every binding is optional here on purpose: `env.test`
 * declares no VPC service, a plain `vite build` has no bindings at all, and
 * `getRailsClient()` selects its transport by which binding EXISTS rather than
 * by an environment name.
 */
export type EdgeEnv = Partial<CloudflareEnv>;

export function getEdgeEnv(): EdgeEnv {
  return env;
}

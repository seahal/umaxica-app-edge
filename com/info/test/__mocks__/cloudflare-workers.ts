/*
 * Stand-in for the `cloudflare:workers` runtime module, which only workerd can
 * resolve. `vitest.config.ts` aliases the specifier here.
 *
 * `env` is mutable so a test can install exactly the bindings the case is about
 * — a VPC service, a REVISION, a RATE_LIMITER, or none at all — and
 * `src/lib/cloudflare-env.ts` reads it through one accessor, so nothing else has
 * to know this file exists.
 *
 * `setEnvShouldThrow` exists because the routes still guard their binding reads
 * with try/catch and those branches have to stay exercised. Under OpenNext the
 * trigger was real: `getCloudflareContext()` threw whenever it ran outside a
 * request context. `cloudflare:workers` cannot throw that way — which is a
 * genuine simplification, recorded in
 * plans/info-nextjs-to-tanstack-start.md — so the guard is now defensive rather
 * than load-bearing, and this is what still proves it fails to a 503 and to
 * nulls instead of to an unhandled exception.
 */
const backing: Record<string, unknown> = {};

let shouldThrow = false;

export function setEnvShouldThrow(value: boolean): void {
  shouldThrow = value;
}

export function resetEnv(): void {
  shouldThrow = false;
  for (const key of Object.keys(backing)) delete backing[key];
}

export function setEnv(values: Record<string, unknown>): void {
  resetEnv();
  Object.assign(backing, values);
}

export const env: Record<string, unknown> = new Proxy(backing, {
  get(target, property, receiver) {
    if (shouldThrow) throw new Error('the Workers environment is unavailable');
    return Reflect.get(target, property, receiver);
  },
});

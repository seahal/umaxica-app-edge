import 'server-only';
import { getCloudflareContext } from '@opennextjs/cloudflare';

const RAILS_FETCH_TIMEOUT_MS = 5000;

// The Rails entry point for this frame.
//
// Workers VPC does NOT route on this host. The VPC Service decides where the
// connection goes — one Service, one tunnel, for all fifteen frames — and this
// URL only populates the `Host` header: "The host provided in the fetch()
// operation is not used to route requests, and instead only populates the Host
// field" (Cloudflare, Workers VPC / VPC Services).
//
// Rails dispatches on that header to `<Frame>::<Brand>::…`. Measured 2026-08-10
// against one VPC Service: `docs.app.localhost` answered from
// `Docs::App::Health::LivenessesController`, `core.com.localhost` from
// `Core::Com::…`. So fifteen frames reach fifteen entry points with no extra
// Cloudflare resources.
//
// This is therefore NOT a label — editing it changes which Rails namespace
// answers. `test/rails-connection-invariants.test.ts` pins the mapping.
const PRIVATE_RAILS_ORIGIN = 'http://docs.app.localhost:3000';

// Stripped from every outbound request, always, on both transports. This is
// about never RELAYING a caller's credentials to Rails — a browser session
// cookie or an inbound Access token must not become a Rails-side identity.
// The dev transport's own service token is applied afterwards, so a caller
// cannot smuggle one in through `init.headers`.
const FORBIDDEN_REQUEST_HEADERS = [
  'cookie',
  'authorization',
  'cf-access-client-id',
  'cf-access-client-secret',
];

export interface RailsFetcher {
  fetch(input: string, init?: RequestInit): Promise<Response>;
}

export type RailsClientInit = Pick<RequestInit, 'method' | 'headers' | 'body'>;

export type RailsClientResult =
  | { kind: 'ok'; status: number; response: Response }
  | { kind: 'http-error'; status: number; response: Response }
  | { kind: 'unreachable'; errorMessage: string }
  | { kind: 'invalid-path'; reason: string };

export interface RailsClient {
  fetch(path: string, init?: RailsClientInit): Promise<RailsClientResult>;
}

// Read one variable at a time rather than asserting the whole of `process.env`
// into a shape it does not have. The Wrangler-generated `NodeJS.ProcessEnv`
// declares only the three bindings from wrangler.jsonc, so these two names are
// not on it at all — which is what the old
// `process.env as unknown as RailsLocalNodeEnv` was hiding, the one
// double-assertion left in this repository's source.
function readLocalFlag(name: string): string | undefined {
  const value: unknown = Reflect.get(process.env, name);
  return typeof value === 'string' ? value : undefined;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function hasControlCharacter(path: string): boolean {
  for (let i = 0; i < path.length; i += 1) {
    const code = path.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) {
      return true;
    }
  }
  return false;
}

function validateRelativePath(path: string): string | null {
  if (path.length === 0) {
    return 'path must not be empty';
  }
  if (!path.startsWith('/')) {
    return 'path must start with a single leading slash';
  }
  if (path.startsWith('//')) {
    return 'path must not be protocol-relative';
  }
  if (path.includes('://')) {
    return 'path must not embed a scheme';
  }
  if (path.includes('\\')) {
    return 'path must not contain a backslash';
  }
  if (hasControlCharacter(path)) {
    return 'path must not contain control characters';
  }
  return null;
}

// Long enough for `ProxyError: <code>`, short enough that a real Rails error
// page is never pulled into memory just to be rejected.
const PROXY_ERROR_MAX_BYTES = 200;

/**
 * The `ProxyError: <code>` that Workers VPC returns when it cannot reach the
 * private origin, or null for any other response.
 *
 * Deliberately narrow: only a 500 with a `text/plain` body is even inspected,
 * and the body is read from a clone so the caller still receives an unconsumed
 * response on every path this does not claim.
 */
async function readProxyError(response: Response): Promise<string | null> {
  if (response.status !== 500) {
    return null;
  }
  if (!response.headers.get('content-type')?.startsWith('text/plain')) {
    return null;
  }

  try {
    const body = (await response.clone().text()).slice(0, PROXY_ERROR_MAX_BYTES).trim();
    return /^ProxyError:\s*\w+/iu.test(body) ? body : null;
  } catch {
    // A body that cannot be read is not evidence of anything; leave the
    // response to be reported as the http-error it appears to be.
    return null;
  }
}

function buildSanitizedHeaders(
  init: RailsClientInit | undefined,
  authHeaders: Readonly<Record<string, string>>,
): Headers {
  const headers = new Headers(init?.headers);
  for (const forbidden of FORBIDDEN_REQUEST_HEADERS) {
    headers.delete(forbidden);
  }
  // Applied after the strip, so the transport's own credentials always win.
  for (const [name, value] of Object.entries(authHeaders)) {
    headers.set(name, value);
  }
  return headers;
}

export function createRailsClient(
  fetcher: RailsFetcher,
  origin: string,
  authHeaders: Readonly<Record<string, string>> = {},
): RailsClient {
  return {
    async fetch(path, init) {
      const validationError = validateRelativePath(path);
      if (validationError) {
        return { kind: 'invalid-path', reason: validationError };
      }

      const url = new URL(path, `${origin}/`);
      if (url.origin !== origin) {
        return { kind: 'invalid-path', reason: 'path resolved outside the fixed origin' };
      }

      try {
        const response = await fetcher.fetch(url.toString(), {
          ...(init?.method === undefined ? {} : { method: init.method }),
          ...(init?.body === undefined ? {} : { body: init.body }),
          headers: buildSanitizedHeaders(init, authHeaders),
          redirect: 'manual',
          cache: 'no-store',
          signal: AbortSignal.timeout(RAILS_FETCH_TIMEOUT_MS),
        });

        if (!response.ok) {
          // Workers VPC does not throw when the private origin is unreachable.
          // It answers with an ordinary HTTP 500 whose body carries the
          // documented code:
          //
          //   500  text/plain  "ProxyError: connection_refused"
          //
          // Measured 2026-08-09 by stopping Rails. Reporting that as
          // `http-error` makes a stopped Rails indistinguishable from a Rails
          // that returned 500 from its own code — the status is honest and the
          // cause is not. `unreachable` is what actually happened: nothing
          // reached Rails. The code is kept in `errorMessage` so the specific
          // failure (connection_refused vs dns_error vs
          // tls_certificate_error) is not lost in the rounding.
          const proxyError = await readProxyError(response);
          if (proxyError) {
            return { kind: 'unreachable', errorMessage: proxyError };
          }
          return { kind: 'http-error', status: response.status, response };
        }

        return { kind: 'ok', status: response.status, response };
      } catch (error) {
        return { kind: 'unreachable', errorMessage: getErrorMessage(error) };
      }
    },
  };
}

/**
 * Two mutually exclusive transports, selected by an actual runtime capability.
 *
 * 1. Local Node dev  → direct private Podman network, with no Access token.
 * 2. VPC binding     → Workers/workerd. Cloudflare grants the real binding.
 * 3. Neither         → null, reported as `not-configured`. Fail closed.
 *
 * **The local-Node check runs first, and the order is load-bearing.**
 *
 * `next.config.ts` passes `remoteBindings: false` so that `next dev` and
 * `next build` never open a Cloudflare remote-proxy session — a Workers VPC
 * binding has no local simulation, so with the default they would, and CI has
 * no token. But wrangler still *materialises the binding*, as a stub that
 * throws on use:
 *
 *   Binding UMAXICA_APPS_EDGE_CF_WORKERS_VPC needs to be run remotely
 *
 * So under `next dev` the binding is *truthy but non-functional*. Testing it
 * first — as this function used to — makes every local Rails call report
 * `unreachable` and makes the direct transport below dead code. Nothing else
 * fails to say so.
 *
 * `EDGE_LOCAL_NODE_RUNTIME` is set only by the `dev` scripts, so workerd preview
 * and the deployed Worker never take this branch and reach the real binding
 * exactly as before. Requiring `EDGE_LOCAL_RAILS_ENABLED` as well matters
 * because the Rails overlay is container-wide: without it, Node dev fails closed
 * to `not-configured` rather than borrowing a transport it was not granted.
 *
 * This is still a branch on runtime *capability*, never on an environment name.
 */
export function getRailsClient(): RailsClient | null {
  const isLocalNodeRuntime = readLocalFlag('EDGE_LOCAL_NODE_RUNTIME') === '1';

  if (isLocalNodeRuntime) {
    if (readLocalFlag('EDGE_LOCAL_RAILS_ENABLED') === '1') {
      return createRailsClient({ fetch }, PRIVATE_RAILS_ORIGIN);
    }
    return null;
  }

  const { env } = getCloudflareContext() as { env: Partial<CloudflareEnv> };

  const binding = env.UMAXICA_APPS_EDGE_CF_WORKERS_VPC;
  if (binding) {
    return createRailsClient(binding, PRIVATE_RAILS_ORIGIN);
  }

  return null;
}

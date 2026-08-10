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
const PRIVATE_RAILS_ORIGIN = 'http://core.org.localhost:3000';

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

/**
 * development-only configuration, read from `process.env` the ordinary Next.js
 * way. Values come from `.env.development.local` (gitignored), which Next.js
 * loads ahead of every other `.env*` file when NODE_ENV is `development`.
 *
 * Deliberately NOT a Cloudflare binding: a binding would have to be declared in
 * `wrangler.jsonc`, whose `vars` are plaintext and ship with the Worker. These
 * are absent from the generated `CloudflareEnv` for the same reason.
 * `test/rails-connection-invariants.test.ts` fails the build if any of these
 * names appears in a `wrangler.jsonc`.
 */
interface RailsDevTransportEnv {
  PUBLIC_CORE_RAILS_ORIGIN?: string;
  PUBLIC_CORE_ACCESS_CLIENT_ID?: string;
  PUBLIC_CORE_ACCESS_CLIENT_SECRET?: string;
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
    return /^ProxyError:\s*\w+/i.test(body) ? body : null;
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
 * Two mutually exclusive transports, chosen by which configuration is present —
 * never by the environment name. See
 * `adr/005-rails-edge-workers-vpc-connection.md`.
 *
 * 1. VPC binding     → production. Cloudflare grants it at runtime.
 * 2. Access + origin → development, from `.env.development.local`. The Edge runs
 *                      in a local container, not on Workers, so there is no VPC
 *                      binding to grant. Requests go out over HTTPS to a
 *                      Cloudflare Access-protected hostname fronting the same
 *                      Rails-side tunnel.
 * 3. Neither         → null, reported as `not-configured`. Fail closed.
 */
export function getRailsClient(): RailsClient | null {
  // The binding is a Cloudflare object, so it can only come from the Cloudflare
  // context. Plain configuration comes from `process.env`, the Next.js way.
  const { env } = getCloudflareContext() as { env: Partial<CloudflareEnv> };

  const binding = env.UMAXICA_APPS_EDGE_CF_WORKERS_VPC;
  if (binding) {
    return createRailsClient(binding, PRIVATE_RAILS_ORIGIN);
  }

  const devEnv = process.env as unknown as RailsDevTransportEnv;
  const origin = devEnv.PUBLIC_CORE_RAILS_ORIGIN;
  const clientId = devEnv.PUBLIC_CORE_ACCESS_CLIENT_ID;
  const clientSecret = devEnv.PUBLIC_CORE_ACCESS_CLIENT_SECRET;

  // All three or nothing. A partial configuration would otherwise reach the
  // Access hostname without credentials and read as a Rails outage.
  if (origin && clientId && clientSecret) {
    return createRailsClient({ fetch }, origin, {
      'cf-access-client-id': clientId,
      'cf-access-client-secret': clientSecret,
    });
  }

  return null;
}

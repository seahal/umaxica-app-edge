import { AsyncLocalStorage } from 'node:async_hooks';

/*
 * The per-request CSP nonce, and the only channel that carries it.
 *
 * `createStartHandler` calls the router entry's `getRouter()` with no arguments,
 * once per request, so there is no parameter to thread a nonce through and a
 * module-level variable would be shared by every request the isolate has in
 * flight at once. `AsyncLocalStorage` is the one mechanism that scopes a value
 * to the request that created it; `nodejs_compat` is already on for this Worker.
 *
 * The nonce exists in PRODUCTION only. `vite dev` injects its own inline scripts
 * (the HMR client, React Refresh's preamble) which carry no nonce, and a policy
 * that names a nonce makes a browser IGNORE `'unsafe-inline'` entirely — so a
 * nonce in development would block the dev server's own bootstrap rather than
 * harden anything. `security-headers.ts` keeps the `'unsafe-inline'` branch for
 * that case and this module simply yields `undefined` there.
 */
const nonceStorage = new AsyncLocalStorage<string>();

/*
 * 128 bits from the runtime CSPRNG, base64-encoded.
 *
 * CSP requires a nonce to be unguessable per response; 16 bytes is the width the
 * spec's own guidance names. `crypto.getRandomValues` is the Workers CSPRNG —
 * `Math.random()` would be a predictable nonce, which is the same as no nonce.
 */
export function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/**
 * Runs `fn` with `nonce` readable by `getRequestNonce()` for the whole
 * asynchronous extent of the call. A `undefined` nonce runs `fn` unwrapped, so
 * the development path pays nothing.
 */
export function runWithNonce<T>(nonce: string | undefined, fn: () => T): T {
  return nonce === undefined ? fn() : nonceStorage.run(nonce, fn);
}

/**
 * The nonce for the request currently being served, or `undefined` outside one —
 * which is every development request, and the build.
 */
export function getRequestNonce(): string | undefined {
  return nonceStorage.getStore();
}

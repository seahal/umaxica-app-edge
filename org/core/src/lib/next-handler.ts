// Isolates the one import that only exists after `opennextjs-cloudflare
// build` has run. Kept in its own module (rather than inline in
// `worker.ts`) so tests can `vi.mock` this whole module — Vitest never has
// to resolve `../.open-next/worker.js` on disk, because a mocked module's
// own source is never loaded.
// @ts-expect-error OpenNext creates this module during the build step.
import nextWorker from '../.open-next/worker.js';

export default nextWorker as {
  fetch(request: Request, env: CloudflareEnv, ctx: ExecutionContext): Promise<Response>;
};

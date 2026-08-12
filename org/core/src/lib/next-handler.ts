// Isolates the one import that only exists after `opennextjs-cloudflare
// build` has run. Kept in its own module (rather than inline in
// `worker.ts`) so tests can `vi.mock` this whole module — Vitest never has
// to resolve `../../.open-next/worker.js` on disk, because a mocked module's
// own source is never loaded.
// @ts-ignore OpenNext creates this module during the build step, so whether it
// resolves depends on whether `opennextjs-cloudflare build` has run. It must be
// @ts-ignore rather than @ts-expect-error: with `allowJs: true` the built file
// DOES resolve, and @ts-expect-error then fails typecheck as unused (TS2578).
// The directive has to be correct in both states.
import nextWorker from '../../.open-next/worker.js';

export default nextWorker as {
  fetch(request: Request, env: CloudflareEnv, ctx: ExecutionContext): Promise<Response>;
};

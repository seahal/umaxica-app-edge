/**
 * Static guardrails for the response-level identity of the published surfaces.
 *
 * A Cloudflare Public Hostname maps a hostname to `http://edge-core:<port>`, and
 * nothing in the response has to agree with that mapping. The apex workers are
 * safe by accident: `createApexApp(..., { service })` puts a per-brand literal in
 * `/health.json`, so `umaxica.com` answering `service=app` is visible. The
 * content frames had no equivalent — the markup and the response headers are the
 * same bytes on all of them, and the only per-brand value in the source,
 * `PRIVATE_RAILS_ORIGIN`, never reaches a response. A transposed ingress entry
 * therefore answered exactly like a correct one.
 *
 * Each `info` frame's `/health.json` route closes that, and these assertions
 * keep the three copies from drifting: each frame owns its own copy (`CLAUDE.md`
 * forbids extracting a shared module), so the failure mode is one copy edited
 * and two left behind, or a copy carrying the wrong brand — which would make the
 * mix-up check assert the wrong thing while still passing.
 *
 * Read from the files, so this needs no container, no dev server and no
 * Cloudflare credential. The live evidence is in
 * `docs/operations/cloudflare-tunnel-development.md`.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = join(import.meta.dirname, '..');
const read = (relativePath: string) => readFileSync(join(repoRoot, relativePath), 'utf8');

/**
 * The frames published through the development Tunnel that carry a
 * `/health.json`. `docs`, `news` and `help` are deliberately absent: they are a
 * later step of the same work, and listing them here before they have the route
 * would fail for a reason that is not drift. Add them with the route, not before.
 */
const IDENTIFIED_FRAMES = [
  { workspace: 'app/info', service: 'app', frame: 'info' },
  { workspace: 'com/info', service: 'com', frame: 'info' },
  { workspace: 'org/info', service: 'org', frame: 'info' },
] as const;

/*
 * Where `/health.json` lives. A frame answers it from a server route whose
 * filename escapes the literal dot (`health[.]json.ts` — an unescaped `.` would
 * nest it under `/health` as `/health/json`). The alternative branch is the
 * empty one the bundler guards elsewhere describe.
 *
 * What is under test is unchanged: three `info` copies, each naming its own
 * brand as a build-time literal so a hostname mix-up is provable rather than
 * merely unproven.
 */
const routePath = (workspace: string) =>
  existsSync(join(repoRoot, workspace, 'next.config.ts'))
    ? `${workspace}/src/app/health.json/route.ts`
    : `${workspace}/src/routes/health[.]json.ts`;

/** Read a `const NAME = 'value';` declaration out of a route copy. */
function readStringConstant(source: string, name: string): string | undefined {
  return new RegExp(`const ${name} = '([^']+)';`, 'u').exec(source)?.[1];
}

describe('published surface identity', () => {
  it.each(IDENTIFIED_FRAMES)('$workspace exposes /health.json', ({ workspace }) => {
    // The path matches the apexes' so a single Access Bypass rule, `/health*`,
    // covers every surface. A frame without the route is not checkable through
    // the Tunnel at all.
    expect(
      existsSync(join(repoRoot, routePath(workspace))),
      `missing ${routePath(workspace)}`,
    ).toBe(true);
  });

  it.each(IDENTIFIED_FRAMES)(
    '$workspace reports service=$service frame=$frame',
    ({ workspace, service, frame }) => {
      const source = read(routePath(workspace));

      expect(readStringConstant(source, 'SERVICE')).toBe(service);
      expect(readStringConstant(source, 'FRAME')).toBe(frame);
    },
  );

  it.each(IDENTIFIED_FRAMES)(
    '$workspace derives identity from code, not the request',
    ({ workspace }) => {
      const source = read(routePath(workspace));

      // The whole point is a build-time literal. Reading the brand off the
      // incoming `Host` (or any other request header) would echo the caller back
      // to itself and prove nothing about which application received the request —
      // a transposed ingress entry would still look correct.
      //
      // Asserted as "the handler is given nothing to read": a `GET` with an
      // empty parameter list has no `Request` to read from. The pattern matches
      // both shapes the two bundlers produce — Next's exported
      // `export async function GET()` and TanStack's `GET: () =>` inside
      // `server.handlers` — because the property is about the parameter list,
      // not about which framework declares it.
      //
      // The named escape hatches are forbidden too: `next/headers` on a Next
      // frame, `getRequest`/`getRequestHeader` on a TanStack one. Matching on the
      // bare word `headers` instead would catch the `ResponseInit` below, which
      // is an ordinary outbound header and not a read of anything.
      expect(source).toMatch(/(?:export\s+async\s+function\s+GET|GET\s*:\s*(?:async\s+)?)\(\)/u);
      expect(source).not.toMatch(/from 'next\/headers'/u);
      expect(source).not.toMatch(/\bgetRequestHeaders?\b|\bgetRequest\b/u);
    },
  );

  it('gives the three copies distinct service values', () => {
    // Guards the case the per-copy assertions cannot see: all three edited
    // together to the same brand. That passes every check above and makes the
    // mix-up test silently vacuous.
    const services = IDENTIFIED_FRAMES.map(({ workspace }) =>
      readStringConstant(read(routePath(workspace)), 'SERVICE'),
    );

    expect(new Set(services).size).toBe(IDENTIFIED_FRAMES.length);
  });
});

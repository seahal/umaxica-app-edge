/**
 * Content frames do not carry `/health.json`. That path is an apex identity
 * probe (`createApexApp(..., { service })`). The twelve Astro surfaces answer
 * liveness on `/health` (Edge + Rails) only — same contract on docs, help,
 * info, and news.
 *
 * A leftover `health.json.ts` on any of them would reintroduce a second health
 * shape that the other eleven do not have.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = join(import.meta.dirname, '..');

const CONTENT_FRAMES = [
  'app/docs',
  'app/help',
  'app/info',
  'app/news',
  'com/docs',
  'com/help',
  'com/info',
  'com/news',
  'org/docs',
  'org/help',
  'org/info',
  'org/news',
] as const;

describe('content-frame health contract', () => {
  it.each(CONTENT_FRAMES)('%s has no /health.json route', (workspace) => {
    expect(existsSync(join(repoRoot, workspace, 'src/pages/health.json.ts'))).toBe(false);
    expect(existsSync(join(repoRoot, workspace, 'src/routes/health[.]json.ts'))).toBe(false);
    expect(existsSync(join(repoRoot, workspace, 'src/app/health.json/route.ts'))).toBe(false);
  });

  it.each(CONTENT_FRAMES)('%s exposes /health', (workspace) => {
    expect(existsSync(join(repoRoot, workspace, 'src/pages/health.ts'))).toBe(true);
  });
});

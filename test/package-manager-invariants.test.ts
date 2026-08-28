import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = join(import.meta.dirname, '..');

/**
 * "pnpm is the only package manager" is stated in three places that cannot
 * enforce it: `.npmrc` (`engine-strict=true` constrains Node, not the manager),
 * `devEngines.packageManager` (pnpm reads it; npm, yarn and bun do not have to)
 * and the README. None of them stops `npm install` from being run in a checkout
 * and none of them notices the lockfile it leaves behind.
 *
 * A foreign lockfile is the observable, durable consequence of the mistake —
 * the moment one is committed the repository has two disagreeing dependency
 * graphs and `pnpm install --frozen-lockfile` is no longer the whole truth.
 * `.gitignore` lists `package-lock.json`, which makes the accident quiet rather
 * than impossible: an explicit `git add -f`, a merge from a branch that already
 * carried one, or a `yarn.lock`/`bun.lock` (neither is ignored) all land
 * without a word. This file is the check that speaks up.
 *
 * The alternative — a `preinstall` guard such as `npx only-allow pnpm` — is
 * rejected on its own terms: it would make `npx` a required part of a
 * repository whose stated position is that npm and npx are not used, and
 * `.npmrc` sets `ignore-scripts=true`, so the guard would not run here anyway.
 */

const FOREIGN_LOCKFILES = ['package-lock.json', 'yarn.lock', 'bun.lock', 'bun.lockb'];

function trackedFiles(): string[] {
  const injected = process.env['EDGE_TRACKED_FILES'];
  if (injected !== undefined) {
    return injected.split('\n').filter(Boolean);
  }
  return execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
}

describe('package manager invariants', () => {
  it('tracks pnpm-lock.yaml and no other lockfile', () => {
    const lockfiles = trackedFiles().filter((file) => FOREIGN_LOCKFILES.includes(basename(file)));
    expect(lockfiles).toEqual([]);
    expect(trackedFiles()).toContain('pnpm-lock.yaml');
  });

  it('declares pnpm through devEngines and not the legacy packageManager field', () => {
    const manifest: {
      packageManager?: string;
      devEngines?: { packageManager?: { name?: string; version?: string } };
    } = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));

    expect(manifest.devEngines?.packageManager?.name).toBe('pnpm');
    expect(manifest.devEngines?.packageManager?.version).toMatch(/^\d+\.\d+\.\d+$/u);

    // Both fields together is the failure mode worth naming: pnpm resolves
    // `packageManager` first, so a stale copy silently overrides the version
    // `devEngines` declares and the one `pnpm-lock.yaml` records.
    expect(manifest.packageManager).toBeUndefined();
  });

  // pnpm 12 parses pnpm-workspace.yaml with a Rust YAML parser that refuses a
  // run of more than 32 comment lines waiting on an entry inside a collection:
  // "too many consecutive comments before resolving collection entry". The file
  // is heavily commented by design, so the limit is easy to cross by adding one
  // more paragraph — and the failure is a hard config-load error on every pnpm
  // command, not a warning. Comments before a top-level key are not capped, so
  // block-level rationale belongs at column 1 above the key it explains.
  it('keeps indented comment runs in pnpm-workspace.yaml under pnpm 12 limit', () => {
    const lines = readFileSync(join(repoRoot, 'pnpm-workspace.yaml'), 'utf8').split('\n');
    let run = 0;
    let longest = 0;
    for (const line of lines) {
      if (/^\s+#/u.test(line)) {
        run += 1;
        longest = Math.max(longest, run);
      } else if (line.trim() !== '') {
        run = 0;
      }
    }
    expect(longest).toBeLessThanOrEqual(32);
  });
});

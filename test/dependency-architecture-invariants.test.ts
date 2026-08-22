import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = join(import.meta.dirname, '..');

/**
 * `pnpm run check:architecture` is a gate that can pass for two very different
 * reasons: because dependency-cruiser found no violations, or because it found
 * no CODE. This repository has already lived through the second one — the
 * TypeScript 7 migration left dependency-cruiser reporting
 *
 *     ✔ no dependency violations found (0 modules, 0 dependencies cruised)
 *
 * on every TypeScript directory, because v18 declares `typescript >=2.0.0 <7.0.0`
 * and cannot load the compiler API this tree needs. That green tick is why the
 * tool was removed rather than kept, and why the configuration that replaced it
 * is pointed only at JavaScript (see .dependency-cruiser.jsonc).
 *
 * This test is the guard on that decision. It fails when the cruise goes empty
 * or nearly empty, whatever the cause: a resolver regression, a bad glob in the
 * `check:architecture` script, an api/run.mjs moved somewhere the script does
 * not look, or another compiler bump that silently takes the parser away again.
 *
 * It deliberately does NOT re-assert "zero violations". That is
 * `check:architecture`'s job and it fails loudly with the offending edges
 * named; duplicating it here would report the same breakage twice. The two
 * layers fail for different reasons, which is the only justification this
 * repository accepts for testing one behaviour in two places.
 */

interface CruiseOutput {
  summary: {
    totalCruised: number;
    totalDependenciesCruised: number;
    error: number;
  };
}

/**
 * The JavaScript surface, enumerated: four modules under tools/ and one
 * api/run.mjs per unit that has an HTTP-contract suite. Every unit has one now
 * — dev/apex gained its suite when it moved from Vercel to Workers, where the
 * server is `vite dev` and starts non-interactively. A floor rather than an
 * equality, so adding a unit does not fail this test, but losing the graph
 * does.
 */
const MINIMUM_MODULES = 20;

/** The same target list `check:architecture` passes, expanded here rather than
 *  by a shell so this runs without `shell: true`. */
function cruiseTargets(): string[] {
  const apiDirs = ['app', 'com', 'org', 'net', 'dev'].flatMap((tld) =>
    readdirSync(join(repoRoot, tld), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `${tld}/${entry.name}/api`)
      .filter((dir) => existsSync(join(repoRoot, dir))),
  );
  return ['tools', ...apiDirs];
}

function cruise(): CruiseOutput {
  const stdout = execFileSync(
    'pnpm',
    [
      'exec',
      'depcruise',
      '--config',
      '.dependency-cruiser.jsonc',
      '--output-type',
      'json',
      ...cruiseTargets(),
    ],
    { cwd: repoRoot, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  );
  return JSON.parse(stdout) as CruiseOutput;
}

describe('dependency-cruiser actually reads the code it gates', () => {
  const summary = cruise().summary;

  it('cruises the whole JavaScript surface, not an empty graph', () => {
    expect(summary.totalCruised).toBeGreaterThanOrEqual(MINIMUM_MODULES);
  });

  it('resolves dependencies rather than parsing files in isolation', () => {
    expect(summary.totalDependenciesCruised).toBeGreaterThan(summary.totalCruised);
  });
});

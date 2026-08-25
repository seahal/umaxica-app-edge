import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = join(import.meta.dirname, '..');
const read = (path: string) => readFileSync(join(repoRoot, path), 'utf8');

/**
 * The two compose files this repository has: `compose.yaml` is what everyone
 * shares, `compose.custom.yaml` is the developer-local overlay. There is no
 * third one, and a new one would have to be added here to be covered.
 */
const composeFiles = ['compose.yaml', 'compose.custom.yaml'] as const;
const compose = composeFiles.map((path) => read(path)).join('\n');

/**
 * One service's block out of `compose.yaml`, so an assertion about the workspace
 * container cannot be satisfied — or violated — by the tunnel connector beside it.
 */
function service(name: string): string {
  return new RegExp(`^  ${name}:\n((?:    .*\n|\n)*)`, 'mu').exec(read('compose.yaml'))?.[1] ?? '';
}
const containerfile = read('Containerfile');
// Comments explain why Corepack is gone, so assertions about what the image
// actually does have to read the instructions rather than the prose.
const instructions = containerfile
  .split('\n')
  .filter((line) => !line.trimStart().startsWith('#'))
  .join('\n');
const devcontainer = read('.devcontainer/devcontainer.json');

describe('development-container security contract', () => {
  it('uses Containerfile as the only repository-owned build definition', () => {
    expect(existsSync(join(repoRoot, 'Containerfile'))).toBe(true);
    expect(existsSync(join(repoRoot, 'Dockerfile'))).toBe(false);
    expect(read('compose.yaml')).toContain('dockerfile: Containerfile');
  });

  it.each(['.gitignore', '.containerignore', '.dockerignore'])(
    '%s excludes the local secret input directory',
    (path) => {
      expect(read(path)).toMatch(/^\.secrets\/?$/mu);
    },
  );

  it('does not give any compose service the host gateway', () => {
    // `extra_hosts: host.docker.internal:host-gateway` exposes the host's
    // network to the container. Tunnel origin is the compose service itself
    // (or a shared Podman network), so the mapping is unused exposure.
    // Comments may name the anti-pattern; only non-comment lines are checked.
    for (const path of composeFiles) {
      const instructionsOnly = read(path)
        .split('\n')
        .filter((line) => !line.trimStart().startsWith('#'))
        .join('\n');
      expect(instructionsOnly, `${path} extra_hosts`).not.toMatch(/^\s*extra_hosts\s*:/mu);
      expect(instructionsOnly, `${path} host-gateway`).not.toContain('host-gateway');
      expect(instructionsOnly, `${path} host.docker.internal`).not.toContain(
        'host.docker.internal',
      );
    }
  });

  it('does not mount host identities, homes, agents, or container-engine sockets', () => {
    const forbidden = [
      'localEnv:HOME',
      '/.ssh',
      'SSH_AUTH_SOCK',
      '/.gnupg',
      '/.config/gh',
      '/.claude',
      '/.codex',
      '/.config/opencode',
      '/.copilot',
      'podman.sock',
      'docker.sock',
    ];
    for (const value of forbidden) {
      expect(devcontainer, `devcontainer contains ${value}`).not.toContain(value);
      expect(compose, `compose contains ${value}`).not.toContain(value);
    }
  });

  it('masks ignored workspace credential inputs behind non-secret mounts', () => {
    const base = read('compose.yaml');
    expect(base).toContain('target: /home/edge/workspace/.secrets');
    expect(base).toContain('source: workspace-secrets-mask');
    expect(base).toContain('nocopy: true');
    expect(base).toContain('target: /home/edge/workspace/.env');
    expect(
      base.match(
        /target: \/home\/edge\/workspace\/(?:app|com|org)\/.+\/\.env\.development\.local/gu,
      ),
    ).toHaveLength(15);
  });

  it('retains rootless keep-id and rejects privilege/network/storage shortcuts', () => {
    expect(read('compose.yaml')).toContain('userns_mode: keep-id');
    for (const pattern of [/privileged\s*:\s*true/u, /network_mode\s*:\s*host/u, /cap_add\s*:/u]) {
      expect(compose).not.toMatch(pattern);
    }

    /*
     * `tmpfs` is scoped to the workspace container rather than to the file. The
     * connector beside it is `read_only: true` and needs a writable /tmp to run
     * at all, so a blanket ban would forbid the safer of the two configurations.
     * `core` is not read-only and has a bind-mounted workspace, so a tmpfs there
     * would only be somewhere state hides from the host.
     */
    // An empty block would satisfy the negative assertion below without reading
    // anything, so prove the extraction found the service first.
    expect(service('core')).toContain('userns_mode: keep-id');
    expect(service('core')).not.toMatch(/\btmpfs\s*:/u);
    expect(read('compose.custom.yaml')).not.toMatch(/\btmpfs\s*:/u);
  });

  it('publishes every normal and OAuth port to host loopback only', () => {
    const publications = [...compose.matchAll(/^\s+- ['"](127\.0\.0\.1:\d+:\d+)['"]/gmu)].map(
      (match) => match[1],
    );
    expect(publications.length).toBeGreaterThan(0);
    for (const publication of publications) {
      expect(publication).toMatch(/^127\.0\.0\.1:\d+:\d+$/u);
    }
  });

  it('does not bake or interpolate credentials', () => {
    expect(containerfile).not.toMatch(/^\s*(?:ARG|ENV)\s+.*(?:TOKEN|SECRET|PASSWORD|API_KEY)/mu);
    expect(containerfile).not.toMatch(
      /^\s*(?:COPY|ADD)\s+.*(?:\.secrets|\.ssh|\.gnupg|\.wrangler)/mu,
    );
    expect(read('compose.yaml')).not.toContain('CLOUDFLARE_API_TOKEN');

    /*
     * Interpolating a credential is no longer forbidden outright — the tunnel
     * connector moved into `compose.yaml`, and reading its token from the
     * gitignored `.env` is exactly how it is supposed to get one. What must stay
     * true is that this is the ONLY such interpolation, and that no compose file
     * ever assigns a credential a literal value.
     */
    const interpolated = read('compose.yaml')
      .split('\n')
      .filter((line) => /\$\{[^}]*(?:TOKEN|SECRET|API_KEY|PASSWORD)/u.test(line))
      .map((line) => line.trim());
    expect(interpolated).toEqual([
      "TUNNEL_TOKEN: '${EDGE_CLOUDFLARED_TOKEN:-${CLOUDFLARED_TOKEN:-}}'",
    ]);
    for (const path of composeFiles) {
      const literals = read(path)
        .split('\n')
        .map((line) =>
          /^\s*[A-Z0-9_]*(?:TOKEN|SECRET|API_KEY|PASSWORD)[A-Z0-9_]*:\s*(.*)$/u.exec(line),
        )
        .filter((match): match is RegExpExecArray => match !== null)
        .map((match) => match[1] as string)
        .filter((value) => !/^['"]?\$\{/u.test(value));
      expect(literals, `${path} assigns a literal credential`).toEqual([]);
    }
  });

  it('builds without Corepack', () => {
    // Node ships Corepack only below 25.0.0, so anything relying on it has an
    // expiry date. Removing it also keeps `corepack enable` from putting a
    // second pnpm on PATH ahead of the standalone install.
    expect(instructions).not.toMatch(/\bcorepack\s+(?:enable|prepare|install)\b/u);
    expect(instructions).toContain('npm rm --global corepack');
  });

  it('installs pnpm from exactly one source, on a predictable PATH', () => {
    expect(containerfile).toMatch(/get\.pnpm\.io\/install\.sh/u);
    expect(containerfile).not.toMatch(/npm\s+(?:install|i)\s+--global[^\n]*\bpnpm@/u);
    // pnpm 11 puts the CLI and its `pn`/`pnpx`/`pnx` aliases in PNPM_HOME/bin.
    // Pointing PATH at PNPM_HOME itself is the v10 layout and leaves no pnpm.
    expect(containerfile).toMatch(/PATH=[^\n]*\$\{?PNPM_HOME\}?\/bin|PATH=[^\n]*\/pnpm\/bin/u);
  });

  it('pins Node and pnpm identically in the Containerfile and package.json', () => {
    const { devEngines } = JSON.parse(read('package.json'));
    expect(containerfile).toContain(`ARG PNPM_VERSION=${devEngines.packageManager.version}`);
    expect(containerfile).toContain(`ARG NODE_VERSION=${devEngines.runtime.version}-trixie`);
  });

  it('declares the toolchain versions through devEngines, not the legacy field', () => {
    const rootPackage = JSON.parse(read('package.json'));
    expect(rootPackage.packageManager).toBeUndefined();
    expect(rootPackage.devEngines.packageManager.name).toBe('pnpm');
    // `download` lets pnpm enforce its own pin; `warn` keeps pnpm from
    // fetching a second Node.js runtime into the image's node_modules.
    expect(rootPackage.devEngines.packageManager.onFail).toBe('download');
    expect(rootPackage.devEngines.runtime.onFail).toBe('warn');
  });

  it('keeps TTY and stdin on the interactive core only', () => {
    expect(compose.match(/^\s+tty:\s*true$/gmu) ?? []).toHaveLength(1);
    expect(compose.match(/^\s+stdin_open:\s*true$/gmu) ?? []).toHaveLength(1);
  });

  it('does not retain dangerous editor or AI bypasses', () => {
    expect(devcontainer).not.toContain('allowDangerouslySkipPermissions');
    expect(devcontainer).not.toContain('extensions.verifySignature');
    expect(devcontainer).not.toMatch(/dangerously-skip-permissions|bypassPermissions/iu);
  });

  it('has no long-lived credential injection path left', () => {
    // Credentials are obtained inside the container through browser flows
    // (`gh auth login --web`, `scripts/wrangler-login`, `claude` /login,
    // `codex login`, `cloudflared access login`) and are never persisted.
    // The credential overlay, its Podman Secrets, and scripts/setup-secrets
    // are gone; nothing may reintroduce them.
    expect(existsSync(join(repoRoot, 'compose.credentials.yaml'))).toBe(false);
    expect(existsSync(join(repoRoot, 'scripts/setup-secrets'))).toBe(false);
    expect(compose).not.toContain('/run/secrets');
    expect(compose).not.toMatch(/^\s*secrets:/mu);

    const scripts = ['dev-start', 'wrangler-login', 'github-readonly-check', 'check-tunnel']
      .map((name) => read(`scripts/${name}`))
      .join('\n');
    expect(scripts).not.toContain('/run/secrets');
    expect(scripts).not.toContain('--credentials');
  });

  it('still proves the secret input directory cannot enter the build context', () => {
    expect(read('scripts/verify-build-context')).toContain('build-context-canary');
  });
});

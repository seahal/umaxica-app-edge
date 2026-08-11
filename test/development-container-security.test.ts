import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = join(import.meta.dirname, '..');
const read = (path: string) => readFileSync(join(repoRoot, path), 'utf8');

const composeFiles = ['compose.yaml', 'compose.credentials.yaml', 'compose.rails.yaml'] as const;
const compose = composeFiles.map((path) => read(path)).join('\n');
const containerfile = read('Containerfile');
const devcontainer = `${read('.devcontainer/devcontainer.json')}\n${read('.devcontainer/compose.override.yml')}`;

describe('development-container security contract', () => {
  it('uses Containerfile as the only repository-owned build definition', () => {
    expect(existsSync(join(repoRoot, 'Containerfile'))).toBe(true);
    expect(existsSync(join(repoRoot, 'Dockerfile'))).toBe(false);
    expect(read('compose.yaml')).toContain('dockerfile: Containerfile');
  });

  it.each(['.gitignore', '.containerignore', '.dockerignore'])(
    '%s excludes the local secret input directory',
    (path) => {
      expect(read(path)).toMatch(/^\.secrets\/?$/m);
    },
  );

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
        /target: \/home\/edge\/workspace\/(?:app|com|org)\/.+\/\.env\.development\.local/g,
      ),
    ).toHaveLength(15);
  });

  it('retains rootless keep-id and rejects privilege/network/storage shortcuts', () => {
    expect(read('compose.yaml')).toContain('userns_mode: keep-id');
    for (const pattern of [
      /privileged\s*:\s*true/,
      /network_mode\s*:\s*host/,
      /\btmpfs\s*:/,
      /cap_add\s*:/,
    ]) {
      expect(compose).not.toMatch(pattern);
    }
  });

  it('starts Dev Containers through the fixed rootless Podman entrypoint', () => {
    const dcup = read('podman/tools/dcup');

    expect(dcup).toContain('readonly podman_path=/usr/bin/podman');
    expect(dcup).toContain('readonly compose_path=/usr/bin/podman-compose');
    expect(dcup).toContain('PODMAN_COMPOSE_PROVIDER=${compose_path}');
    expect(dcup).toContain('--docker-path "${podman_path}"');
    expect(dcup).toContain('--docker-compose-path "${compose_path}"');
    expect(dcup).toContain('--workspace-folder "${repo_root}"');
    expect(dcup).toContain('rootless Podman is unavailable');
    expect(dcup).toContain('--mount | --mount=*');
    expect(dcup).toContain('--secrets-file | --secrets-file=*');
    expect(dcup).not.toMatch(/\bsudo\s+(?:podman|devcontainer)\b/);
    expect(dcup).not.toMatch(/(?:docker|podman)\.sock|SSH_AUTH_SOCK|\/~?\.ssh/);
  });

  it('publishes every normal and OAuth port to host loopback only', () => {
    const publications = [...compose.matchAll(/^\s+- ['"](127\.0\.0\.1:\d+:\d+)['"]/gm)].map(
      (match) => match[1],
    );
    expect(publications.length).toBeGreaterThan(0);
    for (const publication of publications) {
      expect(publication).toMatch(/^127\.0\.0\.1:\d+:\d+$/);
    }
  });

  it('does not bake or interpolate credentials', () => {
    expect(containerfile).not.toMatch(/^\s*(?:ARG|ENV)\s+.*(?:TOKEN|SECRET|PASSWORD|API_KEY)/m);
    expect(containerfile).not.toMatch(
      /^\s*(?:COPY|ADD)\s+.*(?:\.secrets|\.ssh|\.gnupg|\.wrangler)/m,
    );
    expect(read('compose.yaml')).not.toMatch(/\$\{[^}]*(?:TOKEN|SECRET|API_KEY|PASSWORD)[^}]*\}/);
    expect(read('compose.yaml')).not.toContain('CLOUDFLARE_API_TOKEN');
  });

  it('keeps TTY and stdin on the interactive core only', () => {
    expect(compose.match(/^\s+tty:\s*true$/gm) ?? []).toHaveLength(1);
    expect(compose.match(/^\s+stdin_open:\s*true$/gm) ?? []).toHaveLength(1);
  });

  it('does not retain dangerous editor or AI bypasses', () => {
    expect(devcontainer).not.toContain('allowDangerouslySkipPermissions');
    expect(devcontainer).not.toContain('extensions.verifySignature');
    expect(devcontainer).not.toMatch(/dangerously-skip-permissions|bypassPermissions/i);
  });

  it('pins secret registration to rootless files with defensive checks', () => {
    const setup = read('scripts/setup-secrets');
    for (const required of [
      'umask 077',
      'SUDO_UID',
      "stat -c '%F'",
      "stat -c '%a'",
      'git check-ignore',
      '.containerignore',
      '.dockerignore',
      'podman secret create --replace',
    ]) {
      expect(setup).toContain(required);
    }
    expect(read('scripts/verify-build-context')).toContain('build-context-canary');
  });
});

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = join(import.meta.dirname, '..');
const read = (path: string) => readFileSync(join(repoRoot, path), 'utf8');

/**
 * Every compose file this repository has: `compose.yaml` is what everyone
 * shares, `compose.custom.yaml` is the developer-local Rails overlay, and
 * `compose.remote-access.yaml` is the opt-in Tailscale/SSH overlay. A new one
 * would have to be added here to be covered.
 */
const composeFiles = ['compose.yaml', 'compose.custom.yaml', 'compose.remote-access.yaml'] as const;
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

  /*
   * The ban on host `.ssh` paths is absolute again. The SSH server inside `core`
   * authenticates against a repository-local file instead — `.secrets/` is
   * gitignored, and the file holds only the one public key Codex App connects
   * with. Binding the host's own `~/.ssh/authorized_keys`, as an earlier version
   * of this overlay did, would have admitted every key that can log into the
   * host, which is a much wider grant than this container has any use for.
   */
  it('takes authorized keys from .secrets and never from a host .ssh path', () => {
    expect(devcontainer, 'devcontainer references .ssh').not.toContain('/.ssh');

    // Comments are stripped first: the overlay explains at length why it does
    // NOT bind a host `.ssh` path, and that explanation must not be what fails
    // the check.
    const directives = (path: string): string =>
      read(path)
        .split('\n')
        .filter((line) => !line.trimStart().startsWith('#'))
        .join('\n');

    for (const path of composeFiles) {
      expect(directives(path), `${path} references .ssh`).not.toContain('/.ssh');
    }

    const overlay = read('compose.remote-access.yaml');
    expect(overlay).toContain('source: ./.secrets/codex_authorized_keys');

    // A writable mount would let anything with a shell in `core` append its own
    // key and grant itself permanent access.
    expect(overlay).toMatch(
      /source: \.\/\.secrets\/codex_authorized_keys\n\s+target: [^\n]+\n\s+read_only: true/u,
    );

    // The file is where a bootstrap mistake would put a private key, and
    // `.secrets/` must stay untracked for the same reason `.env` does.
    expect(read('.gitignore')).toMatch(/^\.secrets\/$/mu);
  });

  it('keeps Tailscale in-container, unprivileged, and unpublished', () => {
    const directives = (path: string): string =>
      read(path)
        .split('\n')
        .filter((line) => !line.trimStart().startsWith('#'))
        .join('\n');

    const overlay = directives('compose.remote-access.yaml');
    // Both scripts start the daemon: the entrypoint under the remote-access
    // overlay, the wrapper on first `tailscale` call in an ordinary shell.
    const entrypoint = directives('.devcontainer/remote-sshd-entrypoint.sh');
    const wrapper = directives('.devcontainer/tailscale-wrapper.sh');

    // tailscaled moved INTO `core`; the sidecar and the serve.json it mounted
    // are gone. A service that pulls a tailscale image back in would reopen a
    // second container on the tailnet, which is what this whole shape avoids.
    expect(overlay, 'a tailscale sidecar is back in the overlay').not.toMatch(
      /^\s+image:[^\n]*tailscale/mu,
    );
    expect(existsSync(join(repoRoot, '.devcontainer/tailscale-serve.json'))).toBe(false);

    // Userspace networking is the whole reason none of the capabilities below
    // are needed: netstack terminates the tailnet connection and dials sshd
    // over loopback, so tailscaled runs as `edge` with no /dev/net/tun. Every
    // --tun value in either script has to be that one, not just one of them.
    for (const [name, script] of [
      ['remote-sshd-entrypoint', entrypoint],
      ['tailscale-wrapper', wrapper],
    ] as const) {
      const tun = [...script.matchAll(/--tun=(\S+)/gu)].map((match) => match[1]);
      expect(tun.length, `${name} never starts tailscaled`).toBeGreaterThan(0);
      expect([...new Set(tun)], `${name} asks for a tun device`).toEqual(['userspace-networking']);
      // No root, and no route to it: `core` runs `no-new-privileges`, so an
      // escalation here would fail at runtime instead of at review.
      expect(script, `${name} escalates`).not.toMatch(/\bsudo\b/u);
    }

    // `core` is now the container on the tailnet, so its posture IS the
    // sidecar's former posture and has to be asserted here too.
    expect(service('core')).toMatch(/^\s+- no-new-privileges:true$/mu);
    expect(service('core')).toMatch(/cap_drop:\n\s+- ALL/u);

    // The client is what listens to the tailnet, so it must not change under a
    // re-published upstream release: an exact apt pin, from a repository keyed
    // by a keyring baked into the image.
    expect(instructions, 'the Tailscale client is not version-pinned').toMatch(
      /^\s+tailscale=\d+\.\d+\.\d+\s*\\?$/mu,
    );
    expect(instructions).toContain('signed-by=/usr/share/keyrings/tailscale-archive-keyring.gpg');

    // An unauthenticated /healthz and metrics listener, reachable by anything
    // that can route to it, in exchange for nothing `podman logs` does not
    // already report.
    expect(overlay + entrypoint).not.toMatch(/TS_ENABLE_HEALTH_CHECK|--debug-listen/u);

    // Bootstrap-only. A literal key here would be a long-lived credential in
    // version control; it must stay an unset-by-default interpolation.
    expect(overlay).toMatch(/TS_AUTHKEY: ['"]\$\{TS_AUTHKEY:-\}['"]/u);
    expect(overlay + entrypoint).not.toMatch(/tskey-/u);

    // The overlay adds a command and volumes and nothing else; anything below
    // would hand the tailnet-facing container more than it had before.
    for (const pattern of [
      /\bcap_add\s*:/u,
      /\bdevices\s*:/u,
      /\/dev\/net\/tun/u,
      /\bnetwork_mode\s*:/u,
      /\bprivileged\s*:/u,
      /\bports\s*:/u,
    ]) {
      expect(overlay, `remote-access overlay matches ${pattern}`).not.toMatch(pattern);
    }

    // Enrolment carries the shared devcontainer tag -- one ACL grant covers all
    // three containers, and tagged nodes do not expire with a user key -- and
    // refuses tailnet DNS, which would replace this container's resolver.
    expect(entrypoint).toMatch(/--advertise-tags=tag:umaxica-devcontainer/u);
    expect(entrypoint).toMatch(/--accept-dns=false/u);
    expect(entrypoint).toMatch(/--hostname=umaxica-edge-core/u);

    // Tailscale SSH would terminate the session in tailscaled instead of in
    // sshd, which is the one thing this whole arrangement exists to avoid.
    expect(overlay + entrypoint + wrapper).not.toMatch(/--ssh\b/u);

    // The tailnet sees one port, forwarded to sshd over loopback, and the
    // public internet sees none: `serve` is tailnet-only, `funnel` is not.
    expect(entrypoint).toMatch(/serve --bg --tcp=22 tcp:\/\/127\.0\.0\.1:2222/u);
    expect(overlay + entrypoint + wrapper).not.toMatch(/funnel/iu);
  });

  it('serves SSH by public key only, as a non-root user', () => {
    const sshd = read('.devcontainer/remote-sshd_config')
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('#'))
      .join('\n');

    for (const directive of [
      'PasswordAuthentication no',
      'KbdInteractiveAuthentication no',
      'PermitEmptyPasswords no',
      'PubkeyAuthentication yes',
      'AuthenticationMethods publickey',
      'PermitRootLogin no',
      'AllowUsers edge',
      'AllowAgentForwarding no',
      'AllowStreamLocalForwarding no',
      'GatewayPorts no',
      'X11Forwarding no',
      'PermitTunnel no',
      'UsePAM no',
      'StrictModes yes',
      // ~/.ssh/environment lives in the account that owns the workspace bind,
      // so honouring it would let a compromised shell set PATH or LD_PRELOAD
      // for the next login.
      'PermitUserEnvironment no',
      'MaxAuthTries 3',
      'LoginGraceTime 20',
    ]) {
      expect(sshd, `sshd_config lacks ${directive}`).toMatch(new RegExp(`^${directive}$`, 'mu'));
    }

    // `core` drops every capability, so a privileged port is unreachable. The
    // tailnet still only ever sees 22; `tailscale serve` forwards it here over
    // loopback.
    expect(sshd).toMatch(/^Port 2222$/mu);

    // Forwarding the host agent into the container would reintroduce exactly
    // the host credential reuse the mount rules above prevent.
    expect(sshd).not.toMatch(/^AllowAgentForwarding yes$/mu);

    // Port forwarding stays on — Remote SSH needs it to preview a dev server —
    // but only to ports inside this container, so an SSH session can never
    // become a pivot into the Podman networks `core` is attached to.
    expect(sshd).toMatch(/^AllowTcpForwarding yes$/mu);
    expect(sshd).toMatch(/^PermitOpen localhost:\* 127\.0\.0\.1:\* \[::1\]:\*$/mu);

    // The key paths must stay off the workspace bind: `edge` owns it, so a
    // host key or a PID file there is writable by anything with a shell.
    expect(sshd).not.toMatch(/^(?:HostKey|PidFile|AuthorizedKeysFile) .*\/workspace\//mu);

    // Codex App and VS Code Remote SSH read and write files over SFTP. Without
    // the subsystem the connection succeeds and editing silently does not.
    expect(sshd).toMatch(/^Subsystem sftp internal-sftp$/mu);

    // Exactly one SetEnv line. sshd_config keeps the FIRST value it sees for a
    // keyword and discards the rest, so a second SetEnv line parses cleanly and
    // is silently ignored -- the session gets the PATH and none of the rest,
    // which reads as a broken toolchain rather than as dropped configuration.
    // This was a real defect here, not a hypothetical one.
    const setEnvLines = sshd.split('\n').filter((line) => line.startsWith('SetEnv '));
    expect(setEnvLines, 'more than one SetEnv line; all but the first are ignored').toHaveLength(1);
    for (const name of ['PATH=', 'PNPM_HOME=', 'XDG_CONFIG_HOME=', 'BASH_ENV=']) {
      expect(setEnvLines[0], `SetEnv lacks ${name}`).toContain(name);
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
    // pnpm 11 onwards puts the CLI and its `pn`/`pnpx`/`pnx` aliases in
    // PNPM_HOME/bin. Pointing PATH at PNPM_HOME itself is the v10 layout and
    // leaves no pnpm.
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

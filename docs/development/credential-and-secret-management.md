# Credential and secret management

```text
dedicated container credential
        ↓
local .secrets/ file (0700 directory, 0600 files)
        ↓
rootless Podman Secret Store
        ↓
/run/secrets runtime delivery
        ↓
credential-specific process
```

Neither `.secrets/` nor Podman's default secret backend is described as encrypted storage.
Filesystem permissions, a dedicated identity, narrow authority, rotation, and revocation
are part of the boundary.

## Registration

Create `.secrets` without sudo:

```bash
install -d -m 0700 .secrets
```

Place only dedicated container credentials in the expected files, set mode `0600`, then
register one or all names:

```bash
scripts/setup-secrets dev_github_token
scripts/setup-secrets
podman secret ls
```

The script refuses root/sudo, symlinks, non-regular files, empty files, unsafe modes,
missing ignore rules, and non-rootless Podman. It never prints values.

`scripts/dev-start` also refuses unmasked `.dev.vars`, `.env.local`, test-local, or
production-local files. The known legacy root `.env` and frame `.env.development.local`
paths are masked by value-free mounts, so they cannot enter the container. Migrate any
needed dedicated credential to `.secrets/` and Podman Secret instead.

| Podman Secret                         | Local source                               | Consumer                                    |
| ------------------------------------- | ------------------------------------------ | ------------------------------------------- |
| `dev_github_token`                    | `.secrets/github_token`                    | GitHub read-only check and HTTPS Git helper |
| `dev_cloudflare_access_client_id`     | `.secrets/cloudflare_access_client_id`     | `check-tunnel` only                         |
| `dev_cloudflare_access_client_secret` | `.secrets/cloudflare_access_client_secret` | `check-tunnel` only                         |
| `dev_claude_api_key`                  | `.secrets/claude_api_key`                  | Claude `apiKeyHelper`                       |
| `dev_codex_api_key`                   | `.secrets/codex_api_key`                   | Codex login stdin                           |

Wrangler uses dedicated container OAuth state, not an API-token secret. OpenCode Go uses
its supported interactive login and container-only `auth.json`. Tailscale has no key in
this refresh.

## Rotation, revocation, and incidents

Create a replacement at the issuer, overwrite the local file, rerun `scripts/setup-secrets
<name>`, and recreate the credential overlay. Revoke the old credential after validation.
For suspected exposure, stop the credential overlay, revoke first, remove the Podman Secret,
rotate the identity, and inspect repository history without printing values.

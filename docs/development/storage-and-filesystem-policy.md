# Storage and filesystem policy

## No-tmpfs baseline

The audit found no explicit tmpfs mounts. This refresh preserves that state. In particular,
`/tmp`, `/dev/shm`, `node_modules`, the pnpm store, `.next`, caches, coverage, and test output
remain on normal storage.

Run `scripts/benchmark-storage` to record elapsed time, maximum RSS, and repository disk
growth for frozen install, representative Next build, and Vitest. Supplement the report with
Next/workerd startup, Chromium smoke, container memory (`podman stats --no-stream`), and
filesystem-heavy tasks.

Reintroducing tmpfs requires repeated measurements on the target machine, a material and
repeatable improvement, safe peak memory, a bounded mount, and documentation of eviction/
out-of-memory behavior. No such recommendation is made by this refresh.

## Mount and ownership policy

The workspace alone is bind-mounted. HOME is image-owned. Named volumes are limited to
dependencies/cache, pnpm store, Wrangler OAuth state, and OpenCode auth state. Existing
volumes are never deleted by setup or migration scripts. Repairs, if required for an older
volume, must target that volume path only; recursive HOME repair is forbidden.

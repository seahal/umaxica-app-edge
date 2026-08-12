# Edge connectivity acceptance

The active acceptance matrix and commands are maintained in
[`docs/development/cloudflare-development-network.md`](../development/cloudflare-development-network.md).

Use the targeted checks rather than treating one `/health` response as stack-wide proof:

```bash
scripts/check-local
scripts/check-rails
scripts/check-cloudflare
scripts/check-tunnel
scripts/check-vpc
scripts/check-apex-domains
```

## Apex domain binding

`scripts/check-apex-domains` verifies that each production apex hostname is
served by its own Worker, by reading the `service` field of `/health.json`:

| Hostname      | Expected Worker              | `service` |
| ------------- | ---------------------------- | --------- |
| `umaxica.com` | `umaxica-apps-edge-apex-com` | `com`     |
| `umaxica.net` | `umaxica-apps-edge-apex-net` | `net`     |
| `umaxica.org` | `umaxica-apps-edge-apex-org` | `org`     |
| `umaxica.app` | `umaxica-apps-edge-apex-app` | `app`     |

A reachability check is not enough here. A hostname bound to the wrong Worker
still answers `200` on every route — it just serves another domain's content
and, on `/`, another domain's redirect target. This check is what distinguishes
the two.

**The apex hostnames are now owned by the development Cloudflare Tunnel**, so this
check no longer measures a Worker binding — it measures whatever currently owns
the hostname. Under the Tunnel that is the local `*/apex` dev server, and the
`service` field still identifies it. What changed is the subject, not the method.

**Since 2026-08-11 this script does not work unauthenticated.** Cloudflare Access
covers all four apex hostnames with no `/health*` Bypass, so `/health.json`
answers a 302 to the team domain. `curl --fail` trips, `service` is never read,
and every host prints `<unreachable>`. The four `FAIL` lines mean "Access is in
front", not "the binding is wrong" — see
`adr/008-edge-development-tunnel-exposure.md` for why the Bypass was declined.

The script is a manual diagnostic; it is not wired into CI, lefthook, or any
`package.json` script, so nothing automated depends on it. To restore it, send an
Access service token rather than reopening `/health*`. `scripts/check-tunnel`
already carries the safe pattern: `curl --config -` with the headers fed over
stdin so they never appear in the process argv. That change is a deliberate
follow-on and has not been made.

Each `*/apex/wrangler.jsonc` therefore declares `"routes": []` at the top level.
It used to declare `custom_domain: true` so `wrangler deploy` would reconcile the
binding, but a custom domain and a Tunnel Public Hostname cannot both own one
name, so that reconciliation would now reclaim the hostname from the Tunnel on
every production deploy. Restoring an apex domain to its Worker means removing
the Public Hostname entry first, then putting the `routes` entry back — in that
order. See `adr/008-edge-development-tunnel-exposure.md` and
[`cloudflare-tunnel-development.md`](cloudflare-tunnel-development.md).

Known failure at the time of writing: `umaxica.net` answers `service: "app"` in
production — the `app/apex` Worker, not `net/apex`. This is the incident ADR 003
records, still live. The Tunnel cutover masks the symptom without fixing the
binding: measured through the Tunnel on 2026-08-11, while the hostnames were
still unauthenticated, `umaxica.net` answered `service=net` correctly, as did the
other three.

Note that the check no longer distinguishes that case. With Access in front it
fails on **all four** hostnames with `<unreachable>`, so a genuine misbinding and
a healthy surface produce the same output. The last machine-made reading of the
four `service` values is the 2026-08-11 one recorded in
[`cloudflare-tunnel-development.md`](cloudflare-tunnel-development.md).

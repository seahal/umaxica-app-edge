# Cloudflare Access for the Edge development environment

Who is allowed to reach a tunnelled hostname. The tunnel itself — how the
hostnames come to exist at all — is
[`cloudflare-tunnel-development.md`](cloudflare-tunnel-development.md).

## The rule this exists to enforce

Any hostname that exposes a development surface is behind Cloudflare Access.
There is no unauthenticated path to one, including health endpoints.

Two kinds of caller, two kinds of policy, and they must not be mixed:

| Caller                       | Hostname              | Policy                 |
| ---------------------------- | --------------------- | ---------------------- |
| A human, in a browser        | Edge dev surfaces     | interactive login only |
| A local dev server, to Rails | `core-jp.umaxica.app` | Service Auth (a token) |

Putting a Service Auth policy on an Edge surface would turn a shared token into a
bypass for a human-facing environment. Requiring interactive login on the Rails
hostname would break server-to-server calls, which cannot complete a login flow.

## Where enforcement lives

**At the Cloudflare edge, not in the application.** A request that fails Access
never reaches a Worker, so the Workers have no authentication code and need
none.

This is a deliberate boundary, not a gap. Do not implement Access JWT
verification, an `aud` check, a team-domain check, or any bespoke auth in the
apps to "complete" this. Doing so would duplicate an upstream control with a
weaker copy, and would make a misconfigured Access policy look safe in testing.

Concretely, the repository **verifies** no Access assertion: no
`Cf-Access-Jwt-Assertion` handling, no `aud` check, no
`*.cloudflareaccess.com` reference. Inbound enforcement is Cloudflare's job.

What the code does do is control which credentials go **outbound**.
`*/src/lib/rails-client.ts` strips four headers before every call to Rails:

```ts
const FORBIDDEN_REQUEST_HEADERS = [
  'cookie',
  'authorization',
  'cf-access-client-id',
  'cf-access-client-secret',
];
```

…and only then applies its own transport credentials. So a caller's session
cookie or Access token is never relayed onward to Rails, and a caller cannot
override the service token through `init.headers`. The ordering is load-bearing
and is asserted in `test/compose-tunnel-invariants.test.ts`.

Development does hold an Access service token — that is how it reaches Rails —
but it lives in `.env.development.local`, is read only by a `server-only` module,
and never appears in a browser bundle. Production holds no Access credential at
all: it uses the Workers VPC binding.

---

## 1. Repository side — complete, no work outstanding

Already in place:

| Concern                       | Where                                                         |
| ----------------------------- | ------------------------------------------------------------- |
| Dev transport configuration   | `*/.env.example` → `.env.development.local`, gitignored       |
| Secret-leak guards            | `test/compose-tunnel-invariants.test.ts`                      |
| Access header stripping       | `*/src/lib/rails-client.ts`, asserted by the same test file   |
| No connector, no tunnel token | this repository runs neither — asserted by the same test file |

`test/compose-tunnel-invariants.test.ts` fails the build if `.env` becomes
tracked, if any tracked `.env.example` assigns a value to something other than
`PUBLIC_CORE_RAILS_ORIGIN`, if a credential appears under a `NEXT_PUBLIC_*` / `VITE_*`
prefix, if a `rails-client.ts` stops stripping the `cf-access-client-*` headers
or applies its own credentials before stripping — or if a tunnel connector or
`CLOUDFLARED_TOKEN` reappears here.

The connector for the whole system lives in the Rails repository. See
[`cloudflare-tunnel-development.md`](cloudflare-tunnel-development.md) for why
there is only one.

**No code change is required to adopt Access, and none is required to add Entra
ID as the identity provider.** Everything remaining is dashboard work, split
across the two sections below.

---

## 2. Cloudflare side — dashboard, by an administrator

**Not applicable yet.** The Edge dev surfaces are not tunnelled at all right now,
so there is nothing exposed for Access to protect — they are reachable only on
`localhost`. This section becomes live once the unified connector publishes them,
which is the "Unifying onto one connector" work in
[`cloudflare-tunnel-development.md`](cloudflare-tunnel-development.md).

Do those steps in that order. A Public Hostname without an Access application is
a development environment published to the internet.

### 2.1 Create the Access application

Zero Trust → **Access → Applications** → _Add an application_ → **Self-hosted**.

- Add every tunnelled Edge hostname, each with an **empty path** so the whole
  host (`/*`) is covered. One application with multiple domains if available,
  otherwise one per hostname.
- Session duration: the default is fine.

### 2.2 Create the policy

- Action: **Allow**
- Include: **Emails** → the administrator's address, or **Emails ending in** →
  the organisation domain.
- Nothing else.

### 2.3 Forbidden configurations

Each of these publishes the development environment to the internet:

- A `Bypass` action, or an `Everyone` include
- Any policy or application that excludes `/api/*` from Access
- Any unauthenticated exception for `/health`, `/health.json`, or
  `/rails-health`
- A Service Auth policy on these hostnames — interactive login only

The health endpoints are called out explicitly because they are the tempting
exception: an unauthenticated health check would make external probing possible.
We accept losing automated external probing instead — verify in a browser.

### 2.4 Verify

Open each hostname in a private browser window. You must see the Access login
screen, never page content. Content without a login prompt is a live exposure —
fix it before doing anything else.

### 2.5 Scope

Which Edge surfaces get published is decided when the hostnames are registered on
the connector. Adding one later is a Public Hostname entry plus inclusion in the
Access application. No code change either way.

---

## 2b. Rails side — a second, separate Access application

Sections 1 and 2 cover the **Edge** hostnames: who may open a dev surface in a
browser. This one covers the **Rails** hostname, which local development calls
server-to-server. They are different applications with different policies, and
conflating them would let a browser reach Rails.

Needed because a locally-running Edge cannot use the Workers VPC binding — see
[ADR 005](../../adr/005-rails-edge-workers-vpc-connection.md). production is
unaffected and needs none of this.

### 2b.1 Pick the Rails hostname

The Rails-side tunnel (named **`Auth`**, defined in a different repository)
already carries both route types at once:

- **1 VPC route** — the `vpc_services` target production uses. Workers-only;
  never reachable from a browser.
- **13 Public Hostname routes** — internet-facing, fronted by Access.

That is the answer to "does the VPC path need its own dedicated route" — it
already has one, and it is a different _kind_ of route on the same tunnel. A
second tunnel for Rails is not needed, and adding one would only split the
origin across connectors.

So this step is a **choice, not a creation**. The VPC route targets
`core.app.localhost:3000`, and one of the existing public hostnames fronts that
same internal service:

| Public hostname       | Internal service                                   |
| --------------------- | -------------------------------------------------- |
| `core-jp.umaxica.app` | `core.app.localhost:3000` ← the VPC route's target |
| `core-jp.umaxica.com` | `core.com.localhost:3000`                          |
| `core-jp.umaxica.org` | `core.org.localhost:3000`                          |

**Use `core-jp.umaxica.app` for every frame**, including the com and org ones, so
development and production reach the same origin. The reasoning, and what a later
per-brand split would require, is in
[ADR 005](../../adr/005-rails-edge-workers-vpc-connection.md).

Do not point development at the VPC route itself — it is Workers-only and not
reachable over HTTPS, by design.

### 2b.2 Create the application

Zero Trust → **Access → Applications** → Self-hosted, that hostname, path empty.

### 2b.3 Create a service token and a Service Auth policy

Zero Trust → **Access → Service Auth** → create a token for local development.
Then on the application, add a policy:

- Action: **Service Auth**
- Include: **Service Token** → the token just created

> **This is the one place Service Auth is permitted.** Section 2.3 forbids it on
> the Edge hostnames, and that still holds — those are for humans, and a service
> token there would be a bypass. Here the caller is a server process and there is
> no human to authenticate.

Add a second **Allow** policy with an interactive include only if a human also
needs to open the Rails hostname in a browser. Keep it separate from the Service
Auth policy.

### 2b.4 Hand the values to the developer

Into each frame's `.env.development.local` (gitignored — never `wrangler.jsonc`):

```
PUBLIC_CORE_RAILS_ORIGIN=https://<the hostname from 2b.1>
PUBLIC_CORE_ACCESS_CLIENT_ID=<client id>
PUBLIC_CORE_ACCESS_CLIENT_SECRET=<client secret>
```

All three or none: a partial set reaches the hostname unauthenticated, receives a
login page, and reports as a Rails outage.

The token is a credential — send it through a secret manager. Rotate it in Zero
Trust → Access → Service Auth; there is no code change and no deployment.

Blast radius if it leaks: entry to this one Access application. It cannot deploy
or modify a Worker, which is precisely why this transport was chosen over
proxying the VPC binding, which would have required an account-wide Workers
write token on every developer's machine.

---

## 3. Entra ID side — dashboard, by an Entra administrator

**This section is independent of section 2 and can be done later.** Access works
today with the built-in One-time PIN over an email allow-list. Adding Entra ID
replaces _how_ a user proves identity; it does not change what is protected, and
it changes nothing in this repository. Do not block the Access rollout on it.

### 3.1 In Entra ID

1. **App registrations** → _New registration_.
2. Redirect URI, type **Web**:
   `https://<your-team-name>.cloudflareaccess.com/cdn-cgi/access/callback`
   The team name is shown in Zero Trust → Settings → Custom Pages, or is the
   subdomain of your Zero Trust dashboard URL.
3. **Certificates & secrets** → _New client secret_. Record the value
   immediately; it is shown once. Note its expiry — a silently expired secret
   locks everyone out of the development environment.
4. **API permissions** → Microsoft Graph → _Delegated_:
   `openid`, `profile`, `email`, `offline_access`. Add `User.Read`, and
   `GroupMember.Read.All` **only if** you intend to write Access policies against
   Entra groups. Grant admin consent.
5. Record the **Application (client) ID** and **Directory (tenant) ID**.

### 3.2 In Cloudflare

1. Zero Trust → **Settings → Authentication** → _Add new_ login method →
   **Azure AD** (Entra ID).
2. Supply the client ID, client secret, and directory (tenant) ID from 3.1.
3. Enable **support groups** only if you completed the `GroupMember.Read.All`
   consent — it fails at login otherwise.
4. **Test** the connection from the dashboard before touching any policy.
5. Once the test passes, change the policy from 2.2 to include the Entra
   identity provider. Keep One-time PIN enabled for at least one administrator
   until Entra login has been confirmed end to end, so a misconfiguration cannot
   lock everyone out.

### 3.3 Handover boundary

| Needs a Cloudflare admin         | Needs an Entra admin                       |
| -------------------------------- | ------------------------------------------ |
| Access application and policy    | App registration                           |
| Adding the IdP in Zero Trust     | Redirect URI, client secret, Graph consent |
| Team name (for the redirect URI) | Client ID, tenant ID                       |

The two sides exchange exactly three things: the team name goes to Entra, and
the client ID / tenant ID / client secret come back to Cloudflare. The client
secret is a credential — send it through a secret manager, never through chat or
a ticket, and **never commit it to this repository**. Nothing in this repository
consumes it.

---

## Rotating the Entra client secret

1. Entra → the app registration → **Certificates & secrets** → new secret.
2. Zero Trust → Settings → Authentication → the login method → update the secret.
3. Test the connection, then delete the old secret in Entra.

Set a calendar reminder before the expiry date. There is no code-side rotation
step and no deployment.

## Related

- [`cloudflare-tunnel-development.md`](cloudflare-tunnel-development.md) — the
  connector, hostnames, and status tooling
- [ADR 005](../../adr/005-rails-edge-workers-vpc-connection.md) — why Edge
  carries no Access service token toward Rails

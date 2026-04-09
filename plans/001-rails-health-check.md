# Plan 001: Rails Backend Health Check Integration

## Status: Pending

## GitHub Issue

https://github.com/seahal/umaxica-apps-edge/issues/247

## Problem

The apex domains (`app/apex`, `com/apex`, `org/apex`) each expose a `/health` endpoint that currently only reports the Worker's own status (timestamp, brand name). There is no visibility into the Rails backend's health from these endpoints.

The Rails backend exposes `/edge/v0/health` which returns a JSON payload. Apex health pages should fetch this, display the JSON content on success, and clearly surface error states (timeout, connection failure, non-2xx response).

## Scope

- `app/apex`, `com/apex`, `org/apex` only (not `net/apex` or `dev/apex`)
- Local dev environment runs in Docker Compose; the env var value for dev must work cross-container

## Approach

### Environment Variable

Add `RAILS_API_URL` to each affected workspace's `wrangler.jsonc` under both `development` and `production` env blocks.

```
# Docker Compose cross-container (dev):  http://rails:3000
# or host access (dev):                  http://host.docker.internal:3000
# Production:                            https://api.umaxica.com  (TBD)
```

### Shared Logic (`shared/apex/routes/health.ts`)

Extend the health route handler to:

1. Read `RAILS_API_URL` from `c.env` bindings
2. If set, `fetch(`${RAILS_API_URL}/edge/v0/health`)` with a 2000 ms `AbortSignal` timeout
3. Parse the JSON response body
4. Pass the result (or error details) to the HTML builder

Error cases to handle:

- `RAILS_API_URL` not set → display "Rails API URL not configured"
- Fetch throws (network error, DNS failure) → display error message
- Response status is not 2xx → display HTTP status + body if parseable
- JSON parse failure → display raw text

### HTML Builder (`shared/apex/html/health-page.ts`)

Add a second section to the health page:

```
Status:    OK
Timestamp: <iso>

Rails Backend
─────────────
Status:  <ok | error>
Detail:  <json pretty-printed | error message>
```

### Bindings Type

Add `RAILS_API_URL?: string` to `HealthBindings.Bindings`.

## Files to Change

| File                                            | Change                                                 |
| ----------------------------------------------- | ------------------------------------------------------ |
| `shared/apex/routes/health.ts`                  | Add Rails fetch logic + updated bindings type          |
| `shared/apex/html/health-page.ts`               | Add Rails health section to HTML output                |
| `app/apex/wrangler.jsonc`                       | Add `RAILS_API_URL` var                                |
| `com/apex/wrangler.jsonc`                       | Add `RAILS_API_URL` var                                |
| `org/apex/wrangler.jsonc`                       | Add `RAILS_API_URL` var                                |
| `shared/apex/routes/index.test.ts` (or related) | Update/add tests for Rails fetch success + error paths |

## Tests

- Rails fetch succeeds → JSON displayed
- Rails fetch fails (network error) → error message shown, Worker still returns 200
- Rails returns non-2xx → error message with status code shown
- `RAILS_API_URL` not set → "not configured" shown, no fetch attempted

## Notes

- The Worker must remain healthy (200) even when the Rails backend is unreachable; the Rails status is informational only.
- Timeout is 2000 ms, consistent with the existing `hono/timeout` on the route.
- Do not use `hono/timeout` for the Rails sub-fetch; use `AbortSignal.timeout(2000)` to avoid conflating timeouts.

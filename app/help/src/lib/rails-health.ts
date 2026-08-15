import type { RailsClient } from './rails-client';

/*
 * Rails' liveness probe, and the authority for whether this frame's Rails entry
 * point is reachable.
 *
 * Rails also serves `/health/readiness.json` and `/health/startup.json`. Edge
 * deliberately reads neither: liveness is the strictest of the three, so it is
 * the one that decides, and `/health` — which now carries this report — is
 * polled often enough that one request per check is worth keeping. Adding the
 * others means turning this constant into an array; `RailsHealthReport` already
 * reports per probe, so the response shape would not have to change.
 *
 * The path carries no frame prefix. Rails routes on the path exactly as given
 * and picks `<Frame>::<Brand>::…` from the `Host` header instead, which
 * `PRIVATE_RAILS_ORIGIN` in `rails-client.ts` supplies per frame. A prefix here
 * produces `ActionController::RoutingError`, not a frame-scoped route — see
 * `adr/006-development-workers-vpc-transport.md` §4.
 */
const RAILS_LIVENESS_PATH = '/health/liveness.json';

export type RailsProbeKind = 'ok' | 'http-error' | 'unreachable' | 'not-configured';

/**
 * What a probe is allowed to say in public.
 *
 * `status` is present only when Rails or the VPC actually produced an HTTP
 * status. There is deliberately no message field: the previous shape carried an
 * `errorMessage` fed by `rails-client.ts`'s `getErrorMessage(error)`, which put
 * arbitrary exception text on a public endpoint. The specific failure is
 * recoverable from Workers Logs, not from this response.
 *
 * Rails response bodies are never reported here either — this says whether
 * Rails answered, never what it said.
 */
export interface RailsProbeReport {
  kind: RailsProbeKind;
  status?: number;
  latency_ms: number;
}

export interface RailsHealthReport {
  liveness: RailsProbeReport;
}

export async function checkRailsLiveness(client: RailsClient | null): Promise<RailsHealthReport> {
  return { liveness: await probeLiveness(client) };
}

async function probeLiveness(client: RailsClient | null): Promise<RailsProbeReport> {
  if (!client) {
    // Fail closed, visibly. No transport is a reportable state, not a silent
    // success — see `getRailsClient()`.
    return { kind: 'not-configured', latency_ms: 0 };
  }

  const startedAt = Date.now();
  const result = await client.fetch(RAILS_LIVENESS_PATH);
  const latencyMs = Date.now() - startedAt;

  switch (result.kind) {
    case 'ok':
      return { kind: 'ok', status: result.status, latency_ms: latencyMs };
    case 'http-error':
      return { kind: 'http-error', status: result.status, latency_ms: latencyMs };
    case 'unreachable':
    case 'invalid-path':
      // Both mean nothing reached Rails. `invalid-path` cannot arise while the
      // path above is a literal, but the client's result type admits it and
      // collapsing it here keeps the public vocabulary to four kinds.
      return { kind: 'unreachable', latency_ms: latencyMs };
  }
}

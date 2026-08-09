// The direct Workers VPC transport probe.
//
// This exists to answer one question that `/rails-health` structurally cannot:
// did the request actually leave over the VPC binding? `getRailsClient()` falls
// back to a global `fetch()` against an Access-protected hostname that fronts
// the *same* tunnel, and `RailsHealthResult` records no transport identity, so a
// green `/rails-health` is consistent with a completely broken binding.
//
// Therefore this module imports nothing from the application, reads no
// environment variables, and has no `fetch()` path. It calls the binding or it
// reports that the binding is absent. There is no third outcome.
//
// See adr/006-development-workers-vpc-transport.md and
// docs/operations/connectivity-acceptance.md.

// Fixed destination, a module constant. Request input never selects it — the
// probe must not become a way to make the Worker fetch an arbitrary URL from
// inside the private network.
//
// Per Cloudflare's Workers VPC documentation the host here does NOT route the
// request; routing comes wholly from the VPC Service record. The host only
// populates the `Host` header (and SNI over https) and the port is ignored
// outright. Rails selects the brand from that `Host`, which is why this value
// matches `PRIVATE_CORE_RAILS_ORIGIN` in every frame's src/lib/rails-client.ts.
const RAILS_URL = 'http://core.app.localhost:3000/health/liveness.json';

const TIMEOUT_MS = 15_000;

export default {
  async fetch(_request, env) {
    const binding = env.UMAXICA_APPS_EDGE_CF_WORKERS_VPC;
    if (!binding) {
      return Response.json({ probe: 'binding-missing', url: RAILS_URL }, { status: 503 });
    }

    try {
      const response = await binding.fetch(RAILS_URL, {
        redirect: 'manual',
        cache: 'no-store',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      // The body is returned so the checker can confirm Rails answered with the
      // liveness document rather than, say, an Access login page. The checker
      // prints it only under --verbose.
      return Response.json({
        probe: 'reached',
        url: RAILS_URL,
        status: response.status,
        contentType: response.headers.get('content-type'),
        body: (await response.text()).slice(0, 500),
      });
    } catch (error) {
      // Workers VPC throws with a documented code (connection_refused,
      // destination_unavailable, dns_error, …). Pass it through untouched; the
      // checker maps it to a layer, and inventing categories here would lose it.
      return Response.json(
        {
          probe: 'transport-error',
          url: RAILS_URL,
          message: String(error),
          cause: String(error?.cause ?? ''),
        },
        { status: 503 },
      );
    }
  },
};

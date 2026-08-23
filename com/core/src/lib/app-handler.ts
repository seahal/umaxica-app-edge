import {
  createStartHandler,
  defaultRenderHandler,
  defineHandlerCallback,
} from '@tanstack/react-start/server';

import { withSecurityHeaders } from '../security-headers';

/*
 * The application half of this Worker, behind the same one-function seam
 * `lib/next-handler.ts` used to provide.
 *
 * `src/worker.ts` is unchanged by the migration: it still classifies the path,
 * rate-limits once, dispatches Rails-owned paths over the VPC binding and
 * strips `Cookie` in and `Set-Cookie` out around whatever answers the rest
 * (adr/007-shared-fqdn-core-dispatch.md). All that changed is who "the rest"
 * is — TanStack Start instead of the OpenNext build output — which is why that
 * file names this module rather than a framework.
 *
 * The security headers are applied HERE rather than in `worker.ts`, and the
 * distinction is the ADR 007 boundary itself: they belong to documents this
 * application renders. A Rails-owned response is Rails' to header, and passing
 * it through this function would have Edge silently rewrite Rails' policy.
 *
 * `defaultRenderHandler`, not `defaultStreamHandler`: streaming flushes the
 * shell before a failure is known, which produced a 200 with no `<title>` for a
 * thrown error. Measured 2026-08-22; see plans/info-nextjs-to-tanstack-start.md.
 */
const fetchHandler = createStartHandler(defineHandlerCallback((ctx) => defaultRenderHandler(ctx)));

export default {
  async fetch(request: Request): Promise<Response> {
    return withSecurityHeaders(await fetchHandler(request), import.meta.env.PROD);
  },
};

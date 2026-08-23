import {
  createStartHandler,
  defaultRenderHandler,
  defineHandlerCallback,
} from '@tanstack/react-start/server';

import { withSecurityHeaders } from '../security-headers';

/*
 * The application half of this Worker, behind a one-function seam.
 *
 * `src/worker.ts` classifies the path, rate-limits once, dispatches Rails-owned
 * paths over the VPC binding and strips `Cookie` in and `Set-Cookie` out around
 * whatever answers the rest (adr/007-shared-fqdn-core-dispatch.md). It names
 * this module rather than a framework, so which framework renders the
 * application half stays a detail of this file.
 *
 * The security headers are applied HERE rather than in `worker.ts`, and the
 * distinction is the ADR 007 boundary itself: they belong to documents this
 * application renders. A Rails-owned response is Rails' to header, and passing
 * it through this function would have Edge silently rewrite Rails' policy.
 *
 * `defaultRenderHandler`, not `defaultStreamHandler`, and the choice is
 * load-bearing: streaming flushes the shell before a failure is known, which
 * produces a 200 with no `<title>` for a thrown error. Measured, and one of the
 * four constraints in `adr/013-frames-tanstack-start.md`.
 */
const fetchHandler = createStartHandler(defineHandlerCallback((ctx) => defaultRenderHandler(ctx)));

export default {
  async fetch(request: Request): Promise<Response> {
    return withSecurityHeaders(await fetchHandler(request), import.meta.env.PROD);
  },
};

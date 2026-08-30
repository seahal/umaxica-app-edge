import {
  createStartHandler,
  defaultRenderHandler,
  defineHandlerCallback,
} from '@tanstack/react-start/server';

import { withSecurityHeaders } from '../security-headers';
import { createNonce, runWithNonce } from '../security-nonce';
import '../security-nonce-als';

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
 *
 * The CSP nonce is minted here and used twice: `runWithNonce` publishes it to
 * `getRouter()` for the whole asynchronous extent of the render, so TanStack
 * stamps it on the inline hydration script, and `withSecurityHeaders` names the
 * same value in `script-src`. Both readings must come from ONE mint per request
 * — a second call would emit a policy that does not authorise the script the
 * document actually carries. Development mints nothing; see `security-nonce.ts`
 * for why a nonce there would block Vite's own bootstrap.
 */
const fetchHandler = createStartHandler(defineHandlerCallback((ctx) => defaultRenderHandler(ctx)));

export default {
  async fetch(request: Request): Promise<Response> {
    const isProduction = import.meta.env.PROD;
    const nonce = isProduction ? createNonce() : undefined;
    const response = await runWithNonce(nonce, () => fetchHandler(request));

    return withSecurityHeaders(response, isProduction, nonce);
  },
};
